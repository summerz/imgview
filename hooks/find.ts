// Defensive image finder: walks a tool result looking for image blocks, never throws.
export type Found = { data: string; mime: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)

const fromBlock = (o: Record<string, unknown>): Found | undefined => {
  const src = isObj(o.source) ? o.source : undefined
  if (src && src.type === 'base64' && str(src.data)) return { data: String(src.data), mime: str(src.media_type) ?? 'image/png' }
  if (o.type === 'image') {
    if (str(o.data)) return { data: String(o.data), mime: str(o.mimeType) ?? str(o.media_type) ?? 'image/png' }
    // the built-in Read tool: { type: 'image', file: { base64, type } }
    const f = isObj(o.file) ? o.file : undefined
    if (f && str(f.base64)) return { data: String(f.base64), mime: str(f.type) ?? 'image/png' }
  }
  return undefined
}

export const findImage = (v: unknown, depth = 0): Found | undefined => {
  try {
    if (depth > 5 || !isObj(v)) return undefined
    const hit = fromBlock(v)
    if (hit) return hit
    for (const child of Array.isArray(v) ? v : Object.values(v)) {
      const r = findImage(child, depth + 1)
      if (r) return r
    }
  } catch {
    // never throw from a hook
  }
  return undefined
}

export const extFor = (mime: string): string => {
  const m = /image\/([a-z0-9.+-]+)/i.exec(mime)?.[1]?.toLowerCase() ?? 'png'
  return m === 'jpeg' ? 'jpg' : m.replace(/[^a-z0-9]/g, '') || 'png'
}
