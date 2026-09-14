# @opencode-kaush/opencode-intercom

Inter-session messaging for [OpenCode](https://opencode.ai) v2: independent sessions — including sessions in different projects — can message each other through the shared background service.

## What it does

- **`/intercom`** opens a picker dialog of recent sessions (machine-wide), then a message box; sending queues the message into the target session's inbox, where its agent handles it.
- **`intercom_send`** tool is available to every agent. A session that receives a message marked `[intercom]` replies by calling it with no `sessionID` — the sender is resolved automatically.
- Messages **queue while the target is busy** (never steer a running turn) and carry a hop counter capped at 3, so agent-to-agent chains self-terminate instead of ping-ponging.
- Incoming messages toast in any TUI that has the target session open.

## Install

```jsonc
// opencode.jsonc
{
  "plugins": ["@opencode-kaush/opencode-intercom"],
}
```

Restart OpenCode or run `opencode service restart`.

## Tools

| Tool            | Purpose                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `intercom_send` | Message another session. Omit `sessionID` to reply to the session that last messaged you. |

## License

[MIT](../../LICENSE)
