# imgview

Thumbnails for every image a tool returns.

[한국어](README.ko.md)

## Why

A tool returns an image and the transcript shows a path or nothing at all:

- Reading a screenshot gives you no way to see it without leaving the terminal.
- Playwright screenshots scroll past unseen.
- A file path has to be copied and opened by hand.

imgview draws a thumbnail in the transcript row of every image a tool returns, shows the absolute path as a clickable link, and opens the file in one click.

## Install

Run in the prompt of a terminal session:

```
/plugin install imgview --marketplace summerz/imgview
```

Answer `y` to add the marketplace, then pick a scope.

- Prompt: the command above.
- Shell: `claude plugin install imgview --marketplace summerz/imgview`
- Desktop app: `/plugin` does not run. Click + next to the prompt box, then Plugins, then Add marketplace with `summerz/imgview`, then Add plugin.

## Features

- Thumbnails for any tool result that carries an image: Read of an image file, Playwright screenshots, and so on. Terminals that draw images only: Ghostty, kitty, iTerm2, Orca.
- The absolute path appears as a clickable link. With no thumbnail (unsupported terminal or conversion failure), the path and `[view]` stay.
- `[enlarge]` opens the image in a pane.
- `[view]` opens the file in the default browser, or in the app set by `viewer`.
- `/imgview` re-opens the latest image.
- Thumbnails are cached under the plugin's `cache/` folder.

## Settings

| Setting | Default | Does |
| --- | --- | --- |
| `viewer` | `browser` | `[view]` target. `browser` is the default browser; any other value is an app name passed to `open -a`, e.g. `Preview`, `Safari` |

Change it in the plugin's rows of the config menu, or in `~/.claude/settings.json`:

```json
{ "pluginConfigs": { "imgview": { "viewer": "Preview" } } }
```

## Requirements

macOS. imgview calls `sips`, `open` and `base64`.

## License

MIT
