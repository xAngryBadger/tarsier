export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface TreeNode {
  key: string
  value: JsonValue
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'
  children: TreeNode[]
  depth: number
  path: string
}

export function parseJson(input: string): JsonValue | null {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

export function buildTree(value: JsonValue, key: string = 'root', depth: number = 0, path: string = ''): TreeNode {
  const type = getType(value)
  const currentPath = path ? `${path}.${key}` : key

  if (type === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, JsonValue>
    return {
      key,
      value,
      type,
      depth,
      path: currentPath,
      children: Object.entries(obj).map(([k, v]) => buildTree(v, k, depth + 1, currentPath)),
    }
  }

  if (type === 'array' && Array.isArray(value)) {
    return {
      key,
      value,
      type,
      depth,
      path: currentPath,
      children: value.map((v, i) => buildTree(v, `[${i}]`, depth + 1, currentPath)),
    }
  }

  return { key, value, type, depth, path: currentPath, children: [] }
}

export function getType(value: JsonValue): TreeNode['type'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value as 'string' | 'number' | 'boolean'
}

export function formatJson(value: JsonValue, indent: number = 2): string {
  return JSON.stringify(value, null, indent)
}

export function minifyJson(value: JsonValue): string {
  return JSON.stringify(value)
}

export function flattenKeys(value: JsonValue, prefix: string = ''): string[] {
  const keys: string[] = []

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, JsonValue>
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k
      keys.push(path)
      if (v !== null && typeof v === 'object') {
        keys.push(...flattenKeys(v, path))
      }
    }
  }

  return keys
}

export function transformToCsv(value: JsonValue): string {
  if (!Array.isArray(value) || value.length === 0) return ''
  const items = value as Record<string, JsonValue>[]

  const headers = new Set<string>()
  for (const item of items) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const key of Object.keys(item)) {
        headers.add(key)
      }
    }
  }

  const headerRow = Array.from(headers).join(',')
  const rows = items.map((item) =>
    Array.from(headers)
      .map((h) => {
        const val = item[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      })
      .join(','),
  )

  return [headerRow, ...rows].join('\n')
}

export function transformToTypes(value: JsonValue, rootName: string = 'RootObject'): string {
  if (Array.isArray(value)) {
    if (value.length > 0 && value[0] !== null && typeof value[0] === 'object') {
      return `type ${rootName}Item = ${generateType(value[0])}\n\ntype ${rootName} = ${rootName}Item[]`
    }
    return `type ${rootName} = ${tsType(value)}`
  }

  if (value !== null && typeof value === 'object') {
    return `type ${rootName} = ${generateType(value)}`
  }

  return `type ${rootName} = ${tsType(value)}`
}

function generateType(value: JsonValue): string {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return tsType(value)
  }

  const obj = value as Record<string, JsonValue>
  const fields = Object.entries(obj)
    .map(([k, v]) => `  ${k}: ${tsType(v)}`)
    .join('\n')

  return `{\n${fields}\n}`
}

function tsType(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const inner = tsType(value[0])
    return `${inner}[]`
  }
  return generateType(value)
}

export function countNodes(value: JsonValue): { keys: number; depth: number } {
  let keys = 0
  let maxDepth = 0

  function walk(v: JsonValue, d: number) {
    if (d > maxDepth) maxDepth = d
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, JsonValue>
    for (const [, val] of Object.entries(obj)) {
      keys++
      walk(val, d + 1)
      }
    } else if (Array.isArray(v)) {
      for (const item of v) {
        walk(item, d + 1)
      }
    }
  }

  walk(value, 0)
  return { keys, depth: maxDepth }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
