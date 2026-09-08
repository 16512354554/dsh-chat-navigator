# DSH Chat Navigator

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 的右侧对话历史导航插件。

功能包括：

- 浏览当前会话中的用户提问和 steering 提问；
- 打开时显示最近 10 条，每次加载 5 条更早提问，最多 50 条；
- 鼠标悬停预览提问及其后续 AI 回复；
- 在当前会话或其他会话中精确跳转到对应提问；
- 会话运行时实时更新提问列表。

## 安装

将公开的 DSH bundle 安装到 Web profile：

    dsh plugin --profile web add github:16512354554/dsh-chat-navigator

修改 profile 后重启 `dsh web`，然后点击对话区域右侧的对话历史按钮。

本项目遵循 DSH bundle 格式：`package.json` 声明 `dsh.bundle`，`cordis.patch.yml` 将浏览器端插件挂载到 Web overlay slot。安装第三方插件会以当前用户权限执行代码，请在安装前审阅源码。

## 开发

仓库保留 GitHub 安装所需的 `lib/` 构建产物，TypeScript/CSS 源码位于 `src/`。源码依赖 DSH 客户端契约。开发时可以将仓库复制或链接到 DSH checkout 的 `packages/client/ui-chat-navigator`，然后执行：

    pnpm --filter @deepseek-ai/dsh-client-ui-chat-navigator run bundle
    pnpm exec vitest run packages/client/ui-chat-navigator/tests/navigator.client.spec.tsx

客户端 bundle 由 DSH 主机的 module loader 加载，不能作为独立浏览器应用直接打开。

## 许可证

MIT，详见 [LICENSE](LICENSE)。
