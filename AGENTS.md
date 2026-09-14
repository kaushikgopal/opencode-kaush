# opencode-kaush

- npm workspaces live under `extensions/`; each directory is an independently published package.
- Checks: `npm run check` (prettier, typecheck, bun test). `make publish` enforces it.
- Tests use `bun test` (`bun:test` imports).
- Publishing goes through `make publish PACKAGE=<name> [VERSION=x.y.z]`; never run `npm publish` by hand except the first-release bootstrap documented in the README.
- The OpenCode v2 plugin SDK is `@opencode/plugin` (`Plugin.define`); TUI halves export `./tui`.
- Global publish prompt lives in the dotfiles: `ai/pi/agent/prompts/publish-opencode-ext.md`.
