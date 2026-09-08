// @vitest-environment jsdom
// The chat history navigator: the panel lists the current session's user
// questions (newest first, live snapshot), hovering a row reveals a detail
// preview with the following assistant reply, and clicking jumps the
// conversation column to the exact message row. The dock toggles from the
// right edge and shows a hint without an active session.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type {
  ChatConversationViewNode, ChatSnapshot, ConversationSnapshot, SessionId, SessionListState, WorkspaceListState,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
// Load this package's SlotMap and locale namespace declaration merges for the
// direct component imports below; the browser entry imports them at runtime.
import type {} from '../src/client/index.ts'
import { NavigatorDock } from '../src/client/NavigatorDock.tsx'
import { requestNavigatorJump } from '../src/client/NavigatorNavigation.ts'
import { NavigatorPanel } from '../src/client/NavigatorPanel.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** zh-dictionary translate stub: keys resolve through the package dictionary. */
const t = ((key: string) => (zh as Record<string, string>)[key] ?? key) as never

/** A minimal live Chat snapshot: two questions, one assistant reply between. */
function chatFixture(): ChatSnapshot {
  const map = new Map<string, ChatConversationViewNode>()
  const node = (key: string, kind: string, data: unknown, anchorSeq: number): ChatConversationViewNode =>
    ({ key, kind, id: key, target: 'chat', anchorSeq, visibility: 'visible', data }) as ChatConversationViewNode
  map.set('u1', node('u1', 'user', {
    kind: 'user', seq: 1, time: 1700000001000,
    content: [{ type: 'text', text: '第一个问题是什么？' }], source: {},
  }, 1))
  map.set('a1', node('a1', 'assistant', {
    blocks: [{ kind: 'text', text: '这是第一个回答的正文。' }], status: 'settled',
  }, 2))
  map.set('u2', node('u2', 'steering', {
    kind: 'user', seq: 3, time: 1700000002000,
    content: [{ type: 'text', text: '第二个问题呢？' }], source: {},
  }, 3))
  return {
    order: ['u1', 'a1', 'u2'],
    nodes: { get: (key: string) => map.get(key), values: () => [...map.values()] },
  } as unknown as ChatSnapshot
}

function questionOnlyFixture(content: readonly unknown[]): ChatSnapshot {
  const question = ({
    key: 'u-only', kind: 'user', id: 'u-only', target: 'chat', anchorSeq: 1, visibility: 'visible',
    data: { kind: 'user', seq: 1, time: 1700000001000, content, source: {} },
  }) as unknown as ChatConversationViewNode
  return {
    order: ['u-only'],
    nodes: { get: (key: string) => key === 'u-only' ? question : undefined, values: () => [question] },
  } as unknown as ChatSnapshot
}

function manyQuestionsFixture(count: number): ChatSnapshot {
  const map = new Map<string, ChatConversationViewNode>()
  const order: string[] = []
  for (let index = 0; index < count; index += 1) {
    const key = 'question-' + String(index)
    const question = ({
      key, kind: 'user', id: key, target: 'chat', anchorSeq: index + 1, visibility: 'visible',
      data: { kind: 'user', seq: index + 1, time: 1700000000000 + index, content: [{ type: 'text', text: '问题 ' + String(index) }], source: {} },
    }) as unknown as ChatConversationViewNode
    map.set(key, question)
    order.push(key)
  }
  return {
    order,
    nodes: { get: (key: string) => map.get(key), values: () => [...map.values()] },
  } as unknown as ChatSnapshot
}

function statusQuestionFixture(reason: unknown): ChatSnapshot {
  const question = ({
    key: 'status-question', kind: 'user', id: 'status-question', target: 'chat', anchorSeq: 1, visibility: 'visible',
    location: { kind: 'turn', turn: { end: { data: { reason } } } },
    data: { kind: 'user', seq: 1, time: 1700000001000, content: [{ type: 'text', text: '状态问题' }], source: {} },
  }) as unknown as ChatConversationViewNode
  return {
    order: ['status-question'],
    nodes: { get: (key: string) => key === 'status-question' ? question : undefined, values: () => [question] },
  } as unknown as ChatSnapshot
}

function sessionHook(running: boolean): SnapshotSelectorHook<SessionListState> {
  const state = {
    current: 's1' as SessionId,
    byId: { s1: { blank: false, running } },
  } as unknown as SessionListState
  return ((selector: (snapshot: SessionListState) => unknown) => selector(state)) as unknown as SnapshotSelectorHook<SessionListState>
}

describe('NavigatorPanel', () => {
  /** Match the framework hook: apply the selector to a conversation snapshot. */
  const conversationHook = (chat: ChatSnapshot) => {
    const snapshot = { chat } as unknown as ConversationSnapshot
    return ((selector: (value: ConversationSnapshot) => unknown) => selector(snapshot)) as unknown as SnapshotSelectorHook<ConversationSnapshot>
  }
  const useSession = conversationHook(chatFixture())
  const finishedSession = sessionHook(false)
  const never = (() => { throw new Error('unused') }) as never

  it('lists user questions newest first from the live snapshot', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={useSession}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    // Newest first: u2 ('第二个问题呢？') above u1.
    expect(buttons[0]!.textContent).toContain('01')
    expect(buttons[0]!.textContent).toContain('第二个问题呢？')
    expect(buttons[0]!.textContent).not.toContain('提问')
    expect(buttons[1]!.textContent).toContain('02')
    expect(buttons[1]!.textContent).toContain('第一个问题是什么？')
  })

  it('starts with ten newest questions and loads five older at a time up to 50', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(manyQuestionsFixture(51))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    let buttons = screen.getAllByRole('button')
    // Ten question rows plus the load-earlier control on first open.
    expect(buttons).toHaveLength(11)
    expect(buttons[0]!.textContent).toContain('问题 50')
    expect(buttons[9]!.textContent).toContain('问题 41')
    expect(screen.queryByText('问题 40')).toBeNull()

    for (let page = 0; page < 8; page += 1) {
      fireEvent.click(screen.getByRole('button', { name: zh['board.loadOlder'] }))
    }
    buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(50)
    expect(screen.getByText('问题 1')).toBeTruthy()
    expect(screen.queryByText('问题 0')).toBeNull()
    expect(screen.queryByRole('button', { name: zh['board.loadOlder'] })).toBeNull()
  })

  it('marks the newest question as the current one', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={useSession}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const buttons = screen.getAllByRole('button')
    // Newest first: only row 01 carries the board.current marker, with the
    // same accent treatment as the history list's active row.
    expect(buttons[0]!.textContent).toContain(zh['board.current'])
    expect(buttons[0]!.hasAttribute('data-current')).toBe(true)
    expect(buttons[1]!.textContent).not.toContain(zh['board.current'])
    expect(buttons[1]!.hasAttribute('data-current')).toBe(false)
  })

  it('loads older pages so pre-install questions enter the navigator', () => {
    vi.useFakeTimers()
    const loadOlder = vi.fn(() => Promise.resolve())
    const snapshot = { chat: chatFixture(), openState: 'open', hasMore: true, loadingOlder: false } as unknown as ConversationSnapshot
    const pagedSession = ((selector: (value: ConversationSnapshot) => unknown) => selector(snapshot)) as unknown as SnapshotSelectorHook<ConversationSnapshot>
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={pagedSession}
        useSessions={finishedSession}
        loadOlder={loadOlder}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const list = screen.getByRole('list')
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 900 },
      clientHeight: { configurable: true, value: 100 },
    })
    fireEvent.scroll(list)
    act(() => { vi.advanceTimersByTime(800) })
    expect(loadOlder).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('coalesces repeated older-page requests while one page is in flight', async () => {
    vi.useFakeTimers()
    let resolveLoad: (() => void) | undefined
    const pending = new Promise<void>((resolve) => { resolveLoad = resolve })
    const loadOlder = vi.fn(() => pending)
    const snapshot = { chat: manyQuestionsFixture(10), openState: 'open', hasMore: true, loadingOlder: false } as unknown as ConversationSnapshot
    const pagedSession = ((selector: (value: ConversationSnapshot) => unknown) => selector(snapshot)) as unknown as SnapshotSelectorHook<ConversationSnapshot>
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={pagedSession}
        useSessions={finishedSession}
        loadOlder={loadOlder}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const list = screen.getByRole('list')
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 900 },
      clientHeight: { configurable: true, value: 100 },
    })
    fireEvent.scroll(list)
    act(() => { vi.advanceTimersByTime(800) })
    expect(loadOlder).toHaveBeenCalledTimes(1)
    // The host snapshot can lag the request state by a frame; the in-flight
    // guard prevents a second network call during that gap.
    fireEvent.scroll(list)
    act(() => { vi.advanceTimersByTime(800) })
    expect(loadOlder).toHaveBeenCalledTimes(1)
    resolveLoad?.()
    await act(async () => { await pending })
    vi.useRealTimers()
  })

  it('auto-fills older pages when the loaded window cannot scroll', () => {
    vi.useFakeTimers()
    const loadOlder = vi.fn(() => Promise.resolve())
    // A running session's tail page can be dominated by one huge streaming
    // turn, leaving the board with fewer questions than a scrollable list;
    // paging must then continue without any scroll event.
    const snapshot = { chat: chatFixture(), openState: 'open', hasMore: true, loadingOlder: false } as unknown as ConversationSnapshot
    const pagedSession = ((selector: (value: ConversationSnapshot) => unknown) => selector(snapshot)) as unknown as SnapshotSelectorHook<ConversationSnapshot>
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={pagedSession}
        useSessions={finishedSession}
        loadOlder={loadOlder}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(loadOlder).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('shows a detail preview with the assistant reply on hover', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={useSession}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const buttons = screen.getAllByRole('button')
    // The CSS keeps this node to one visual line; the hover card uses its
    // dedicated previewQuestion element for the multi-line preview.
    expect(buttons[1]!.querySelector('[class*=itemText]')).not.toBeNull()
    fireEvent.mouseEnter(buttons[1]!)
    expect(screen.getByText('这是第一个回答的正文。')).toBeTruthy()
    expect(document.querySelector('[class*=previewQuestion]')).not.toBeNull()
  })

  it('hides the preview after leaving the question row', () => {
    vi.useFakeTimers()
    const { container } = render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={useSession}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.mouseEnter(buttons[1]!)
    expect(screen.queryByText('回复预览')).toBeNull()
    expect(screen.getByText(zh['preview.status.completed'])).toBeTruthy()
    // The pointer is still inside the panel (e.g. over its header), so the
    // old root-level mouseleave handler never fired here.
    fireEvent.mouseLeave(buttons[1]!, { relatedTarget: container.firstElementChild })
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.queryByText('回复预览')).toBeNull()
    vi.useRealTimers()
  })

  it('shows completed-without-text instead of waiting forever', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(questionOnlyFixture([{ type: 'text', text: '已完成的问题' }]))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    fireEvent.mouseEnter(screen.getAllByRole('button')[0]!)
    expect(screen.getByText(zh['preview.status.completed'])).toBeTruthy()
    expect(screen.queryByText(zh['preview.status.running'])).toBeNull()
  })

  it('labels forced interruption in red', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(statusQuestionFixture({ kind: 'error', error: {} }))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    const status = screen.getByText(zh['preview.status.interrupted'])
    expect(status.className).toContain('previewStatusInterrupted')
  })

  it('labels user cancellation in blue', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(statusQuestionFixture({ kind: 'aborted', reason: { kind: 'user' } }))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    const status = screen.getByText(zh['preview.status.userStopped'])
    expect(status.className).toContain('previewStatusUserStopped')
  })

  it('labels normal turn completion in green', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(statusQuestionFixture({ kind: 'completed' }))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    const status = screen.getByText(zh['preview.status.completed'])
    expect(status.className).toContain('previewStatusCompleted')
  })

  it('shows image and file metadata without exposing attachment bytes', () => {
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(questionOnlyFixture([
          { type: 'text', text: '请检查附件' },
          { type: 'image', attachment: { name: 'screen.png', width: 800, height: 600 } },
          { type: 'file', name: 'report.pdf', size: 2048 },
        ]))}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    const item = screen.getByRole('button')
    expect(item.textContent).toContain('screen.png')
    expect(item.textContent).toContain('report.pdf')
    fireEvent.mouseEnter(item)
    expect(screen.getAllByText('screen.png')).toHaveLength(2)
    expect(screen.getAllByText('report.pdf')).toHaveLength(2)
    expect(screen.queryByText(/attachmentId|base64|data:/i)).toBeNull()
  })

  it('jumps to the exact message row on click', () => {
    const onJump = vi.fn()
    window.addEventListener('dsh-chat-jump', onJump)
    const targetRow = document.createElement('div')
    targetRow.setAttribute('data-chat-anchor-key', 'u1')
    document.body.appendChild(targetRow)
    try {
      render(
        <NavigatorPanel
          sessionId={'s1' as SessionId}
          useSession={useSession}
          useSessions={finishedSession}
          useWorkspaces={never}
          useProjection={never}
          useInput={never}
          inputActions={never}
          t={t}
        />,
      )
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[1]!)
      // ChatView opens its follow-suppression settle window on this event.
      expect(onJump).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('dsh-chat-jump', onJump)
      targetRow.remove()
    }
  })

  it('jumps to a requested question after switching sessions', () => {
    const onJump = vi.fn()
    window.addEventListener('dsh-chat-jump', onJump)
    const targetRow = document.createElement('div')
    targetRow.setAttribute('data-chat-anchor-key', 'u2')
    document.body.appendChild(targetRow)
    try {
      requestNavigatorJump('s1' as SessionId, '第二个问题呢？')
      render(
        <NavigatorPanel
          sessionId={'s1' as SessionId}
          useSession={useSession}
          useSessions={finishedSession}
          useWorkspaces={never}
          useProjection={never}
          useInput={never}
          inputActions={never}
          t={t}
        />,
      )
      expect(onJump).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('dsh-chat-jump', onJump)
      targetRow.remove()
    }
  })

  it('re-asserts the jump while the transcript assembles and stops on reader input', () => {
    vi.useFakeTimers()
    const onJump = vi.fn()
    window.addEventListener('dsh-chat-jump', onJump)
    const targetRow = document.createElement('div')
    targetRow.setAttribute('data-chat-anchor-key', 'u1')
    // Out of view: the settle loop must re-assert the position.
    vi.spyOn(targetRow, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 5000, bottom: 5100 } as DOMRect),
    )
    document.body.appendChild(targetRow)
    try {
      render(
        <NavigatorPanel
          sessionId={'s1' as SessionId}
          useSession={useSession}
          useSessions={finishedSession}
          useWorkspaces={never}
          useProjection={never}
          useInput={never}
          inputActions={never}
          t={t}
        />,
      )
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[1]!)
      const afterJump = onJump.mock.calls.length
      expect(afterJump).toBe(1)
      vi.advanceTimersByTime(500)
      // jsdom reports no scroll height, so the loop sees a stable layout and
      // re-asserts while the row stays out of view.
      const reasserted = onJump.mock.calls.length
      expect(reasserted).toBeGreaterThan(afterJump)
      // Reader takeover cancels the loop: no further re-asserts.
      fireEvent.wheel(window)
      vi.advanceTimersByTime(600)
      expect(onJump.mock.calls.length).toBe(reasserted)
    } finally {
      window.removeEventListener('dsh-chat-jump', onJump)
      vi.useRealTimers()
      targetRow.remove()
    }
  })

  it('renders the empty hint when the snapshot has no questions', () => {
    const empty = {
      order: [],
      nodes: { get: () => undefined, values: () => [] },
    } as unknown as ChatSnapshot
    render(
      <NavigatorPanel
        sessionId={'s1' as SessionId}
        useSession={conversationHook(empty)}
        useSessions={finishedSession}
        useWorkspaces={never}
        useProjection={never}
        useInput={never}
        inputActions={never}
        t={t}
      />,
    )
    expect(screen.getByText(zh['empty.noMessages'])).toBeTruthy()
  })
})

describe('NavigatorDock', () => {
  // A real selector hook applies the selector to the current session-list snapshot.
  // Returning the snapshot itself would make the selected boolean truthy even
  // when current is undefined, masking the no-session branch.
  const sessionHook = (state: SessionListState) =>
    ((selector: (snapshot: SessionListState) => unknown) => selector(state)) as unknown as SnapshotSelectorHook<SessionListState>
  const activeSessions = sessionHook({
    current: 's1' as SessionId,
    byId: { s1: { blank: false } },
  } as unknown as SessionListState)
  const renderSlot = (() => <div data-testid="panel-body" />) as never
  const SessionProvider = (() => null) as never

  it('toggles the panel from the right-edge tab', () => {
    render(
      <NavigatorDock
        useSessions={activeSessions}
        useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
        renderSlot={renderSlot}
        SessionProvider={SessionProvider}
        t={t}
      />,
    )
    expect(screen.queryByTestId('panel-body')).toBeNull()
    const closedTab = screen.getByRole('button', { name: zh['dock.open'] })
    expect(closedTab.querySelector('path')?.getAttribute('d')).toBe('M10 4L6 8l4 4')
    fireEvent.click(closedTab)
    expect(screen.getByTestId('panel-body')).toBeTruthy()
    const openTab = screen.getByRole('button', { name: zh['dock.close'] })
    expect(openTab.querySelector('path')?.getAttribute('d')).toBe('M6 4l4 4-4 4')
    fireEvent.click(openTab)
    expect(screen.queryByTestId('panel-body')).toBeNull()
  })

  it('lists persisted sessions and opens the selected historical session', () => {
    const openSessionAt = vi.fn()
    const sessions = sessionHook({
      ids: ['s-current', 's-old'] as SessionId[],
      current: 's-current' as SessionId,
      byId: {
        's-current': { id: 's-current', displayTitle: '当前会话', cwd: 'D:/Projects/YodoFit1', blank: false, updatedAt: 1700000002000 },
        's-old': { id: 's-old', title: '第二个项目的问题', displayTitle: '安装前的旧对话', lastPrompt: '第二个项目里真正要跳转的问题', cwd: 'D:/Projects/LegacyApp', blank: false, updatedAt: 1700000001000 },
      },
    } as unknown as SessionListState)
    render(
      <NavigatorDock
        useSessions={sessions}
        openSessionAt={openSessionAt}
        useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
        renderSlot={renderSlot}
        SessionProvider={SessionProvider}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: zh['dock.open'] }))
    expect(screen.getByText(zh['history.title'])).toBeTruthy()
    expect(screen.getByText('YodoFit1')).toBeTruthy()
    expect(screen.getByText('LegacyApp')).toBeTruthy()
    expect(screen.getAllByText(/\d{2}\/\d{2} \d{2}:\d{2}/)).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /第二个项目里真正要跳转的问题/ }))
    expect(openSessionAt).toHaveBeenCalledWith('s-old', '第二个项目里真正要跳转的问题')
  })

  it('keeps only the newest 50 historical sessions', () => {
    const ids = Array.from({ length: 51 }, (_, index) => ('s-' + String(index)) as SessionId)
    const byId = Object.fromEntries(ids.map((id, index) => [id, {
      id,
      displayTitle: index === 0 ? '最旧会话' : '会话 ' + String(index),
      cwd: 'D:/Projects/YodoFit1',
      blank: false,
      updatedAt: 1700000000000 + index,
    }]))
    const sessions = sessionHook({ ids, current: ids[50], byId } as unknown as SessionListState)
    render(
      <NavigatorDock
        useSessions={sessions}
        useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
        renderSlot={renderSlot}
        SessionProvider={SessionProvider}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: zh['dock.open'] }))
    expect(screen.getByText('50')).toBeTruthy()
    expect(screen.queryByText('最旧会话')).toBeNull()
    expect(screen.getByText('会话 50')).toBeTruthy()
  })

  it('resizes the history and question cards with the divider', () => {
    const sessions = sessionHook({
      ids: ['s1'] as SessionId[],
      current: 's1' as SessionId,
      byId: { s1: { id: 's1', displayTitle: '可调整会话', cwd: 'D:/Projects/YodoFit1', blank: false, updatedAt: 1700000001000 } },
    } as unknown as SessionListState)
    render(
      <NavigatorDock
        useSessions={sessions}
        useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
        renderSlot={renderSlot}
        SessionProvider={SessionProvider}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: zh['dock.open'] }))
    const divider = screen.getByRole('separator')
    const before = Number(divider.getAttribute('aria-valuenow'))
    fireEvent.keyDown(divider, { key: 'ArrowDown' })
    expect(Number(divider.getAttribute('aria-valuenow'))).toBeGreaterThan(before)
  })

  it('reveals the active conversation row when the panel opens', () => {
    const ids = ['s-new', 's-mid', 's-old'] as SessionId[]
    const byId = {
      's-new': { id: 's-new', displayTitle: '最新会话', cwd: 'D:/Projects/YodoFit1', blank: false, updatedAt: 3000 },
      's-mid': { id: 's-mid', displayTitle: '中间会话', cwd: 'D:/Projects/YodoFit1', blank: false, updatedAt: 2000 },
      's-old': { id: 's-old', displayTitle: '最旧会话', cwd: 'D:/Projects/YodoFit1', blank: false, updatedAt: 1000 },
    }
    const sessions = sessionHook({ ids, current: 's-old', byId } as unknown as SessionListState)
    // jsdom has no layout: the current row sits far below the visible list.
    const rectOf = (top: number, bottom: number): DOMRect =>
      ({ top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
    const original = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      return this.tagName === 'BUTTON' ? rectOf(500, 560) : rectOf(0, 100)
    }
    try {
      render(
        <NavigatorDock
          useSessions={sessions}
          useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
          renderSlot={renderSlot}
          SessionProvider={SessionProvider}
          t={t}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: zh['dock.open'] }))
      const currentRow = document.querySelector('button[aria-current="page"]') as HTMLElement
      expect(currentRow).toBeTruthy()
      const list = currentRow.parentElement as HTMLElement
      expect(list.scrollTop).toBeGreaterThan(0)
    } finally {
      Element.prototype.getBoundingClientRect = original
    }
  })

  it('shows the no-session hint without an active session', () => {
    const empty = sessionHook({ current: undefined, byId: {} } as unknown as SessionListState)
    render(
      <NavigatorDock
        useSessions={empty}
        useWorkspaces={(() => ({})) as unknown as SnapshotSelectorHook<WorkspaceListState>}
        renderSlot={renderSlot}
        SessionProvider={SessionProvider}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: zh['dock.open'] }))
    expect(screen.getByText(zh['empty.noSession'])).toBeTruthy()
  })
})
