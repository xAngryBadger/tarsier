import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { revealVariants, staggerContainer } from '../hooks/useScrollReveal'
import { TreeView } from './TreeView'
import {
  type JsonValue,
  parseJson,
  buildTree,
  formatJson,
  minifyJson,
  transformToCsv,
  transformToTypes,
  countNodes,
  copyToClipboard,
  downloadText,
} from '../lib/jsonEngine'

type TransformMode = 'pretty' | 'minify' | 'csv' | 'types'

const SAMPLE_JSON: JsonValue = {
  users: [
    { id: 1, name: "Isaac Nathan", role: "Full-Stack Developer", active: true, score: 98.5 },
    { id: 2, name: "Ana Silva", role: "Designer", active: false, score: 87.3 },
    { id: 3, name: "Carlos Mendes", role: "DevOps Engineer", active: true, score: 92.1 },
  ],
  metadata: {
    total: 3,
    page: 1,
    per_page: 10,
    filters: { active: null, role: null }
  }
}

export function JsonWorkbench() {
  const [input, setInput] = useState(JSON.stringify(SAMPLE_JSON, null, 2))
  const [mode, setMode] = useState<TransformMode>('pretty')
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => parseJson(input), [input])
  const tree = useMemo(() => parsed !== null ? buildTree(parsed) : null, [parsed])
  const stats = useMemo(() => parsed !== null ? countNodes(parsed) : null, [parsed])

  const output = useMemo(() => {
    if (parsed === null) return ''
    switch (mode) {
      case 'pretty': return formatJson(parsed)
      case 'minify': return minifyJson(parsed)
      case 'csv': return transformToCsv(parsed)
      case 'types': return transformToTypes(parsed)
    }
  }, [parsed, mode])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [output])

  const handleDownload = useCallback(() => {
    if (!output) return
    const ext = mode === 'csv' ? 'csv' : mode === 'types' ? 'ts' : 'json'
    downloadText(output, `tarsier-output.${ext}`)
  }, [output, mode])

  const isValid = parsed !== null

  return (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={revealVariants} custom={0} className="mb-8">
          <p className="eyebrow text-[var(--color-primary)] mb-3">JSON Transformer</p>
          <h2 className="text-3xl md:text-4xl font-serif font-normal text-[var(--color-text-light)] leading-tight">
            Visualize, formate & transforme<br />
            <span className="text-[var(--color-accent)]">seu JSON</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-muted)] max-w-md">
            100% client-side — cole, visualize a árvore, gere CSV ou tipos TypeScript.
          </p>
        </motion.div>

        <motion.div variants={revealVariants} custom={0.1} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-mono text-[var(--color-text-muted)]">Input</p>
              <div className="flex items-center gap-2">
                {stats && (
                  <>
                    <span className="label-mono text-[0.5625rem] text-[var(--color-text-muted)]">{stats.keys} keys</span>
                    <span className="label-mono text-[0.5625rem] text-[var(--color-primary)]">depth {stats.depth}</span>
                  </>
                )}
              </div>
            </div>
            <div className={`border ${isValid ? 'border-[var(--color-border-subtle)]' : 'border-red-500/50'} bg-[var(--color-bg-alt)]`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="json-editor w-full h-[500px] bg-transparent text-[var(--color-text)] p-4"
                placeholder="Cole seu JSON aqui..."
                spellCheck={false}
              />
            </div>
            {!isValid && input.trim() && (
              <p className="label-mono text-[0.5625rem] text-red-400 mt-2">JSON inválido</p>
            )}
          </div>

          {/* Tree */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-mono text-[var(--color-text-muted)]">Tree View</p>
              <span className="label-mono text-[0.5625rem] text-[var(--color-accent)]">collapsible</span>
            </div>
            <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-alt)] h-[500px] overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)] [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-track]:transparent">
              {tree ? (
                <TreeView node={tree} />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm font-mono">
                  Cole JSON válido para visualizar
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-mono text-[var(--color-text-muted)]">Output</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="label-mono text-[0.5625rem] text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-40"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="label-mono text-[0.5625rem] text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40"
                >
                  Baixar
                </button>
              </div>
            </div>

            <div className="flex gap-1 mb-3">
              {(['pretty', 'minify', 'csv', 'types'] as TransformMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1.5 text-xs transition-all duration-200 ${
                    mode === m
                      ? 'bg-[var(--color-primary)] text-[var(--color-cream)]'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {m === 'pretty' ? 'Pretty' : m === 'minify' ? 'Minify' : m === 'csv' ? 'CSV' : 'TS Types'}
                </button>
              ))}
            </div>

            <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-alt)] h-[468px] overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)] [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-track]:transparent">
              {output ? (
                <pre className="json-editor whitespace-pre-wrap break-all text-[var(--color-text)]">{output}</pre>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm font-mono">
                  Sem output
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick stats bar */}
        {stats && (
          <motion.div variants={revealVariants} custom={0.2} className="mt-6 grid grid-cols-4 gap-4">
            <div className="fade-border-bottom pb-3 text-center">
              <p className="stat-value text-sm text-[var(--color-text-light)]">{stats.keys}</p>
              <p className="label-mono text-[0.5625rem] text-[var(--color-text-muted)] mt-1">Chaves</p>
            </div>
            <div className="fade-border-bottom pb-3 text-center">
              <p className="stat-value text-sm text-[var(--color-primary)]">{stats.depth}</p>
              <p className="label-mono text-[0.5625rem] text-[var(--color-text-muted)] mt-1">Profundidade</p>
            </div>
            <div className="fade-border-bottom pb-3 text-center">
              <p className="stat-value text-sm text-[var(--color-accent)]">{new Blob([input]).size}</p>
              <p className="label-mono text-[0.5625rem] text-[var(--color-text-muted)] mt-1">Bytes</p>
            </div>
            <div className="fade-border-bottom pb-3 text-center">
              <p className="stat-value text-sm text-[var(--color-text-light)]">{mode.toUpperCase()}</p>
              <p className="label-mono text-[0.5625rem] text-[var(--color-text-muted)] mt-1">Formato</p>
            </div>
          </motion.div>
        )}
</motion.div>
)
}
