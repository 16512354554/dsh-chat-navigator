# DSH Chat Navigator

A right-edge chat-history navigator for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web.

It adds a compact dock that lets you:

- browse the current session's user and steering questions;
- open with the newest ten questions and load five older questions at a time, up to fifty;
- preview a question and its following assistant reply on hover;
- jump to the exact question in the current or another session;
- follow live question updates while a session is running.

## Install

Install the public DSH bundle into the Web profile:

    dsh plugin --profile web add github:16512354554/dsh-chat-navigator

Restart `dsh web` after changing the profile, then open the chat-history button on the right edge of the conversation view.

The package is a normal DSH bundle: `package.json` declares `dsh.bundle`, and `cordis.patch.yml` mounts the browser client into the Web overlay slot. Installing a plugin runs third-party code with your user permissions; review the source before installing it.

## Development

The repository keeps the generated `lib/` runtime artifacts required for GitHub installs and includes the TypeScript/CSS source under `src/`. The source is built against the DSH client contracts. To develop it inside a DSH checkout, copy or link this repository into `packages/client/ui-chat-navigator`, then run:

    pnpm --filter @deepseek-ai/dsh-client-ui-chat-navigator run bundle
    pnpm exec vitest run packages/client/ui-chat-navigator/tests/navigator.client.spec.tsx

The DSH package's client bundle is loaded through the host module loader; it must not be opened as a standalone browser application.

## License

MIT. See [LICENSE](LICENSE).
