import { useState, useCallback } from 'react'
import { type TreeNode } from '../lib/jsonEngine'

interface TreeViewProps {
  node: TreeNode
}

export function TreeView({ node }: TreeViewProps) {
  return (
    <div className="font-mono text-sm leading-relaxed">
      <TreeNodeItem node={node} defaultExpanded />
    </div>
  )
}

function TreeNodeItem({ node, defaultExpanded = false }: { node: TreeNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded && node.depth < 2)
  const hasChildren = node.children.length > 0
  const isRoot = node.key === 'root'

  const toggle = useCallback(() => {
    setExpanded((e) => !e)
  }, [])

  const renderValue = () => {
    switch (node.type) {
      case 'string':
        return <span className="tree-string">"{String(node.value)}"</span>
      case 'number':
        return <span className="tree-number">{String(node.value)}</span>
      case 'boolean':
        return <span className="tree-bool">{String(node.value)}</span>
      case 'null':
        return <span className="tree-null">null</span>
      default:
        return null
    }
  }

  const braceOpen = node.type === 'array' ? '[' : '{'
  const braceClose = node.type === 'array' ? ']' : '}'

  return (
    <div style={{ paddingLeft: isRoot ? 0 : '1.25em' }}>
      <div
        className={`inline-flex items-center gap-1 ${hasChildren ? 'cursor-pointer hover:bg-[var(--color-bg-elevated)]' : ''} px-1 rounded-sm`}
        onClick={hasChildren ? toggle : undefined}
      >
        {hasChildren && (
          <span className="text-[var(--color-text-muted)] text-xs w-3 text-center select-none">
            {expanded ? '▾' : '▸'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}

        {!isRoot && (
          <>
            <span className="tree-key">{node.key}</span>
            <span className="text-[var(--color-text-muted)]">: </span>
          </>
        )}

        {hasChildren ? (
          <>
            <span className="text-[var(--color-text-muted)]">{braceOpen}</span>
            {!expanded && (
              <span className="text-[var(--color-text-muted)] text-xs cursor-pointer" onClick={toggle}>
                {node.children.length} {node.type === 'array' ? 'items' : 'keys'} {braceClose}
              </span>
            )}
          </>
        ) : (
          renderValue()
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeItem key={`${child.path}-${i}`} node={child} />
          ))}
          <div style={{ paddingLeft: isRoot ? 0 : '1.25em' }} className="px-1">
            <span className="text-[var(--color-text-muted)]">{braceClose}</span>
          </div>
        </div>
      )}
    </div>
  )
}
