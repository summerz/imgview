// Pure helpers: PNG size from the base64 header, and terminal rows for a picture.
export type Size = { width: number; height: number }

const SIG = [0x89, 0x50, 0x4e, 0x47]

/** Width and height from the IHDR chunk, read off the first 24 bytes. */
export const pngSize = (base64: string): Size | undefined => {
  try {
    const bin = atob(base64.slice(0, 44))
    if (bin.length < 24 || SIG.some((b, i) => bin.charCodeAt(i) !== b)) return undefined
    const u32 = (at: number) => ((bin.charCodeAt(at) << 24) | (bin.charCodeAt(at + 1) << 16) | (bin.charCodeAt(at + 2) << 8) | bin.charCodeAt(at + 3)) >>> 0
    const width = u32(16)
    const height = u32(20)
    return width > 0 && height > 0 ? { width, height } : undefined
  } catch {
    return undefined
  }
}

/** A cell is about twice as tall as wide, so rows = cols * h / w / 2, clamped. */
export const thumbRows = (cols: number, w: number, h: number, min = 2, max = 12): number => {
  if (!(w > 0) || !(h > 0)) return Math.min(max, Math.max(min, 6))
  return Math.min(max, Math.max(min, Math.round((cols * h) / w / 2)))
}
