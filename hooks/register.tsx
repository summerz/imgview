import type { EngineInterface, Register, RenderElement } from 'claude-code'
import { extFor, findImage } from './find'
import type { Found } from './find'
import { pngSize, thumbRows } from './png'

const PANE = 'imgview'
const ENV = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>
const DIR = `${ENV.CLAUDE_PLUGIN_ROOT || `${ENV.HOME}/.claude/mods/imgview`}/cache`
const MAX = 50
const THUMB_COLS = 24
const THUMB_ROWS = 6

type Entry = { png: string; path: string; mime: string }

// ponytail: module variables, a reload drops the map and the current pick, which is fine
const entries = new Map<string, Entry>()
let current: string | undefined
let latest: string | undefined

const remember = (id: string, entry: Entry) => {
  entries.delete(id)
  entries.set(id, entry)
  while (entries.size > MAX) entries.delete(entries.keys().next().value as string)
  latest = id
}

const safe = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_')

const writeFile = async ($: EngineInterface, dst: string, base64: string): Promise<boolean> => {
  try {
    await $.process.run(['mkdir', '-p', DIR])
    const r = await $.process.run(['sh', '-c', 'base64 -d > "$0"', dst], { stdin: base64 })
    return r.exitCode === 0
  } catch {
    return false
  }
}

const readBase64 = async ($: EngineInterface, path: string): Promise<string | undefined> => {
  try {
    return (await $.fs.read(path, { as: 'bytes' })).base64
  } catch {
    return undefined
  }
}

// Builds an entry from an image found in a result; `file` is the real path when the tool read one.
const build = async ($: EngineInterface, id: string, found: Found, file?: string): Promise<Entry | undefined> => {
  const ext = extFor(found.mime)
  const key = safe(id || String(Date.now()))
  let path = file
  if (!path) {
    path = `${DIR}/${key}.${ext}`
    if (!(await writeFile($, path, found.data))) return undefined
  }
  let png = ext === 'png' ? found.data : ''
  if (!png) {
    try {
      const dst = `${DIR}/${key}.thumb.png`
      await $.process.run(['mkdir', '-p', DIR])
      const r = await $.process.run(['sips', '-s', 'format', 'png', '-Z', '1200', path, '--out', dst])
      if (r.exitCode === 0) png = (await readBase64($, dst)) ?? ''
    } catch {
      // no thumbnail, the path and [view] stay
    }
  }
  return { png, path, mime: found.mime }
}

const base = (path: string) => path.split('/').pop() || path

// [view]: the default browser (its bundle id read once from LaunchServices), or the app named in the `viewer` setting
let viewer = 'browser'
let browserId: string | undefined
const DETECT = "import plistlib,os;d=plistlib.load(open(os.path.expanduser('~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist'),'rb'));print(next((h.get('LSHandlerRoleAll') or '' for h in d.get('LSHandlers',[]) if h.get('LSHandlerURLScheme')=='https'),''))"
const view = async ($: EngineInterface, path: string) => {
  if (viewer !== 'browser') { await $.process.run(['open', '-a', viewer, path]); return }
  if (browserId === undefined) {
    const r = await $.process.run(['python3', '-c', DETECT]).catch(() => undefined)
    browserId = r?.exitCode === 0 && r.stdout.trim() ? r.stdout.trim() : 'com.apple.Safari'
  }
  await $.process.run(['open', '-b', browserId, path])
}

const enlarge = async ($: EngineInterface, id: string) => {
  const entry = entries.get(id)
  if (!entry) return
  current = id
  await $.ui.open({ id: PANE, title: base(entry.path), rows: 30, columns: 100, focus: true, closeOnEscape: true })
}

type Ui = ReturnType<EngineInterface['ui']['resolve']>

const absPath = (input: unknown): string | undefined => {
  const p = (input as { file_path?: unknown } | null | undefined)?.file_path
  return typeof p === 'string' && p.startsWith('/') ? p : undefined
}

// Finds (or builds and remembers) the entry for one tool call.
const entryFor = async ($: EngineInterface, id: string, output: unknown, input: unknown): Promise<Entry | undefined> => {
  const known = entries.get(id)
  if (known) return known
  const found = findImage(output)
  if (!found) return undefined
  const entry = await build($, id, found, absPath(input))
  if (entry) remember(id, entry)
  return entry
}

// The thumbnail block: Button-wrapped Image plus the path line.
const thumbOf = ($: EngineInterface, ui: Ui, entry: Entry, id: string) => {
  if (!('Image' in ui)) return null
  const { Box, Button, Image, Link } = ui
  const { png, path } = entry
  const size = pngSize(png)
  const rows = size ? thumbRows(THUMB_COLS, size.width, size.height) : THUMB_ROWS
  return (
    <Box key={`thumb:${id}`} flexDirection="column">
      {png && <Image source={{ png }} columns={THUMB_COLS} rows={rows} alt={`[image ${path}]`} />}
      <Box gap={1}>
        <Link href={`file://${path}`} label={path} />
        <Button key={`view:${id}`} plain label="[view]" onPress={() => view($, path)} />
        {png && <Button key={`big:${id}`} plain label="[enlarge]" onPress={() => enlarge($, id)} />}
      </Box>
    </Box>
  )
}

export const register: Register = (on, options) => {
  viewer = typeof options.viewer === 'string' && options.viewer.trim() ? options.viewer.trim() : 'browser'
  on('command.run', { command: 'imgview' }, async $ => {
    if (!latest || !entries.has(latest)) {
      await $.ui.open({ id: PANE, title: 'imgview', rows: 4, columns: 40, focus: true, closeOnEscape: true })
      current = undefined
      return { text: 'No image yet.' }
    }
    await enlarge($, latest)
    return { text: 'imgview opened.' }
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'imgview', description: 'Enlarge the most recent tool image' })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    try {
      const found = findImage(r.result)
      if (!found) return r
      // the built-in Read puts the path beside the tool name, as e.file_path
      const file = (e as { file_path?: unknown }).file_path
      const entry = await build($, e.tool_use_id, found, e.tool === 'Read' && typeof file === 'string' && file.startsWith('/') ? file : undefined)
      if (entry) { remember(e.tool_use_id, entry); $.ui.invalidate('ui.render') }
    } catch {
      // never fail a tool call over a thumbnail
    }
    return r
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const r = await next(e)
    const id = e.props.tool_use_id
    const entry = await entryFor($, id, e.props.output, e.props.input)
    if (!entry) return r
    const ui = $.ui.resolve(e)
    const thumb = thumbOf($, ui, entry, id)
    if (!thumb) return r
    if (r == null || !('Box' in ui)) return thumb
    const { Box } = ui
    return (
      <Box flexDirection="column">
        {r as RenderElement}
        {thumb}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const r = await next(e)
    if (e.props.isExpanded) return r
    const ui = $.ui.resolve(e)
    const thumbs = []
    for (const call of e.props.calls) {
      const id = call.tool_use_id
      if (!id) continue
      const entry = await entryFor($, id, call.output, call.input)
      const thumb = entry && thumbOf($, ui, entry, id)
      if (thumb) thumbs.push(thumb)
    }
    if (!thumbs.length || !('Box' in ui)) return r
    const { Box } = ui
    return (
      <Box flexDirection="column">
        {r == null ? null : (r as RenderElement)}
        {thumbs}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const ui = $.ui.resolve(e)
    if (!('Image' in ui)) return next(e)
    const { Box, Button, Image, Link, Text } = ui
    const entry = current ? entries.get(current) : undefined
    if (!entry) return <Text dimColor>No image yet.</Text>
    const { png, path } = entry
    const cols = Math.min(255, Math.max(1, e.props.bodyColumns - 2))
    const size = pngSize(png)
    const fit = Math.max(1, e.props.scroll.bodyRows - 2)
    const rows = size ? Math.min(fit, 255, Math.max(1, Math.round((cols * size.height) / size.width / 2))) : Math.min(fit, 20)
    return (
      <Box flexDirection="column">
        {png ? <Image source={{ png }} columns={cols} rows={rows} alt={`[image ${path}]`} /> : <Text dimColor>No preview for this format.</Text>}
        <Box gap={1}>
          <Link href={`file://${path}`} label={path} />
          <Button key="view" plain hotkey="v" label="[view]" onPress={() => view($, path)} />
          <Button key="close" plain hotkey="q" label="[close]" onPress={() => $.ui.close({ id: PANE })} />
        </Box>
      </Box>
    )
  })
}
