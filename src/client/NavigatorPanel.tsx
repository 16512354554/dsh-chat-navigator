// NavigatorPanel: the session-scoped body of the chat-history dock. Reads the
// current session's Chat snapshot through useSession (live: every streamed
// user/assistant event re-renders it) and renders one row per user question
// (kind 'user' or 'steering'), newest first. Hovering a row shows a floating
// detail preview with text, safe attachment metadata, and the following
// assistant reply; clicking jumps the conversation column to that exact
// message row and flashes it.
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AssistantBlock, ChatConversationViewNode, ChatNodeStore, UserMessageNode,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { completeNavigatorJump, useNavigatorJump } from './NavigatorNavigation.ts'
import css from './NavigatorPanel.module.css'

/** Full composed props: session standard kit + global kit + locale. */
export type NavigatorPanelProps =
  & PropsRuntime<'chat.navigator.panel'>
  & PropsLocale<'chat.navigator'>
  & {
    /** Loads older pages while resolving a cross-session question target. */
    loadOlder?: () => Promise<void>
  }

/** The question board keeps at most 50 questions, paged in small UI batches. */
const MAX_QUESTION_ITEMS = 50
const INITIAL_QUESTION_ITEMS = 10
const QUESTION_PAGE_SIZE = 5

/** A Chat node that carries a user-asked question. */
type QuestionNode = ChatConversationViewNode & {
  kind: 'user' | 'steering'
  data: UserMessageNode
}

type UnknownRecord = Record<string, unknown>

interface AttachmentSummary {
  kind: 'image' | 'file'
  name?: string | undefined
  detail?: string | undefined
}

/** Narrow a Chat node to a user/steering question (structural; no value import). */
function questionNodeOf(node: ChatConversationViewNode): QuestionNode | null {
  if (node.kind !== 'user' && node.kind !== 'steering') return null
  const data = node.data
  if (typeof data !== 'object' || data === null) return null
  const probe = data as { seq?: unknown; time?: unknown; content?: unknown }
  if (typeof probe.seq !== 'number' || typeof probe.time !== 'number' || !Array.isArray(probe.content)) return null
  return node as QuestionNode
}

/** Concatenated text of one user question's text blocks. */
function questionText(node: QuestionNode): string {
  return node.data.content
    .filter((block): block is { type: 'text'; text: string } =>
      block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join(' ')
    .trim()
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : undefined
}

/** Keep names user-facing and never expose opaque ids, paths, or raw bytes. */
function safeDisplayName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (normalized === '') return undefined
  const slash = normalized.split('/').pop() ?? normalized
  return slash.split(String.fromCharCode(92)).pop() || undefined
}

function byteDetail(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined
  if (value < 1024) return String(Math.round(value)) + ' B'
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
  return (value / (1024 * 1024)).toFixed(1) + ' MB'
}

/** Extract presentation-safe attachment metadata from core and extension blocks. */
function attachmentSummaries(node: QuestionNode): AttachmentSummary[] {
  const summaries: AttachmentSummary[] = []
  for (const raw of node.data.content as readonly unknown[]) {
    const block = asRecord(raw)
    if (block === undefined) continue
    if (block.type === 'image') {
      const attachment = asRecord(block.attachment) ?? block
      const width = typeof attachment.width === 'number' && Number.isFinite(attachment.width)
        ? Math.round(attachment.width) : undefined
      const height = typeof attachment.height === 'number' && Number.isFinite(attachment.height)
        ? Math.round(attachment.height) : undefined
      const dimensions = width !== undefined && height !== undefined
        ? String(width) + '×' + String(height) : undefined
      summaries.push({ kind: 'image', name: safeDisplayName(attachment.name), detail: dimensions })
      continue
    }
    // The canonical v1 content union stores images as image blocks. Keep this
    // defensive branch for future/provider extensions that preserve files as
    // structured blocks, without displaying file ids or path-like data.
    if (block.type === 'file' || block.type === 'document' || block.type === 'attachment') {
      const nested = asRecord(block.file)
      summaries.push({
        kind: 'file',
        name: safeDisplayName(block.name)
          ?? safeDisplayName(block.filename)
          ?? safeDisplayName(block.fileName)
          ?? safeDisplayName(nested?.name),
        detail: byteDetail(block.size ?? nested?.size),
      })
    }
  }
  return summaries
}

/** First assistant text block of the assistant reply following a question. */
function firstReplyText(blocks: readonly AssistantBlock[] | undefined): string | null {
  if (blocks === undefined) return null
  const block = blocks.find(entry => entry.kind === 'text')
  return block !== undefined && block.kind === 'text' && block.text.trim() !== '' ? block.text.trim() : null
}

type ReplyStatus = 'running' | 'completed' | 'interrupted' | 'userStopped'

interface ReplyWindow {
  text: string | null
  /** False when a later question closed this question's reply window. */
  open: boolean
  status: ReplyStatus
}

/** Convert the durable turn-end reason into a compact preview status. */
function replyStatusOf(
  question: QuestionNode,
  running: boolean,
  assistantInterrupted: boolean,
  assistantSettled: boolean,
): ReplyStatus {
  const location = question.location
  // Older fixture/snapshot producers may omit timeline facts; use assistant
  // lifecycle data when available instead of making a settled hover render red.
  if (location === undefined) {
    if (running) return 'running'
    return assistantInterrupted ? 'interrupted' : 'completed'
  }
  const turn = location.kind === 'turn' || location.kind === 'step' ? location.turn : undefined
  const reason = turn?.end?.data.reason
  if (reason === undefined) {
    if (running) return 'running'
    if (assistantInterrupted) return 'interrupted'
    if (assistantSettled || location.kind === 'session' || location.kind === 'unresolved') return 'completed'
    return 'interrupted'
  }
  if (reason.kind === 'completed') return 'completed'
  if (reason.kind === 'aborted' && reason.reason.kind === 'user') return 'userStopped'
  return 'interrupted'
}

/** Collect assistant text and preserve the durable question status. */
function replyAfter(
  nodes: ChatNodeStore,
  order: readonly string[],
  fromIndex: number,
  question: QuestionNode,
  running: boolean,
): ReplyWindow {
  const parts: string[] = []
  let budget = 0
  let open = true
  let assistantInterrupted = false
  let assistantSettled = false
  for (let i = fromIndex + 1; i < order.length; i += 1) {
    const key = order[i]
    const node = key === undefined ? undefined : nodes.get(key)
    if (node === undefined) continue
    // The next question closes the window: no assistant reply to show.
    if (node.kind === 'user' || node.kind === 'steering') {
      open = false
      break
    }
    if (node.kind === 'assistant') {
      const data = node.data as { blocks?: readonly AssistantBlock[]; status?: unknown }
      assistantInterrupted ||= data.status === 'interrupted'
      assistantSettled ||= data.status === 'settled'
      const text = firstReplyText(data.blocks)
      if (text !== null) {
        parts.push(text)
        budget += text.length
        if (budget >= 300) break
      }
    }
  }
  const joined = parts.join(' ').trim()
  return {
    text: joined === '' ? null : joined,
    open,
    status: replyStatusOf(question, running, assistantInterrupted, assistantSettled),
  }
}

/** Local time label: HH:MM, or with the date when not today. */
function timeLabel(time: number): string {
  const date = new Date(time)
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  if (sameDay) return hh + ':' + mm
  return String(date.getMonth() + 1) + '/' + String(date.getDate()) + ' ' + hh + ':' + mm
}

/** A hovered row's preview material (question + safe metadata + reply). */
interface Preview {
  key: string
  text: string
  attachments: readonly AttachmentSummary[]
  reply: string | null
  status: ReplyStatus
  time: number
}

/** Escape a node key for use inside a quoted attribute selector. */
function escapeAttributeValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  const slash = String.fromCharCode(92)
  return value.split(slash).join(slash + slash).replaceAll('"', slash + '"')
}

/** Normalize question/title text for tolerant cross-session matching. */
function normalizedTargetText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').toLocaleLowerCase()
}

/** Find the requested question in the currently loaded window. */
function matchingQuestion(items: readonly QuestionNode[], targetText: string): QuestionNode | null {
  const needle = normalizedTargetText(targetText)
  if (needle === '') return null
  return items.find((item) => {
    const text = normalizedTargetText(questionText(item))
    return text === needle || text.includes(needle) || needle.includes(text)
  }) ?? null
}

/** Window event that opens ChatView's jump settle window (see ChatView). */
const JUMP_SETTLE_EVENT = 'dsh-chat-jump'

// Only the latest jump may keep a settle loop alive. This prevents rapid
// history clicks from leaving several 8-second timers fighting over scrollTop.
let activeSettleCancel: (() => void) | null = null

/** Nearest scrollable ancestor of a transcript row (null when none). */
function transcriptScrollerOf(row: HTMLElement): HTMLElement | null {
  let scroller: HTMLElement | null = row.parentElement
  while (scroller !== null && scroller !== row.ownerDocument.body) {
    const overflow = window.getComputedStyle(scroller).overflowY
    if (overflow === 'auto' || overflow === 'scroll') break
    scroller = scroller.parentElement
  }
  return scroller === row.ownerDocument.body ? null : scroller
}

/** Bring a row's top edge into its scrollport with a small margin: the
 *  anchor element can span the whole turn (question + long answer), so
 *  centering by rect center would leave the question itself off-screen. */
function centerRow(row: HTMLElement, scroller: HTMLElement | null): void {
  if (scroller === null) return
  const rowRect = row.getBoundingClientRect()
  const spRect = scroller.getBoundingClientRect()
  scroller.scrollTop += (rowRect.top - spRect.top) - 24
}

/** Scroll the conversation column to a Chat row and flash it. */
function jumpToQuestion(key: string, flashClass: string | undefined): boolean {
  activeSettleCancel?.()
  activeSettleCancel = null
  const selector = '[data-chat-anchor-key="' + escapeAttributeValue(key) + '"]'
  const row = document.querySelector<HTMLElement>(selector)
  if (row === null) return false
  centerRow(row, transcriptScrollerOf(row))
  // Dispatched after the scroll so ChatView arms its preservation anchor at
  // the jumped position and suppresses bottom-follow while the settle window
  // is open.
  window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT))
  if (flashClass !== undefined) {
    row.classList.add(flashClass)
    window.setTimeout(() => { row.classList.remove(flashClass) }, 1800)
  }
  // The transcript keeps assembling after a cross-session open (history pages
  // and media hydrate for seconds), so a one-shot scroll loses the position —
  // and re-asserting mid-assembly fights the anchored preservation. Instead,
  // wait for the scroll height to stabilise, then re-assert once per stable
  // tick; the reader's own scrolling cancels the loop immediately. The
  // scroller is re-resolved every tick: ChatView remounts it on session
  // switches, so a captured element goes stale and silently drops writes.
  const settleStartedAt = Date.now()
  let lastHeight = -1
  const stopSettle = (): void => {
    window.clearInterval(settleTimer)
    window.removeEventListener('wheel', stopSettle)
    window.removeEventListener('touchstart', stopSettle)
    if (activeSettleCancel === stopSettle) activeSettleCancel = null
  }
  const settleTimer = window.setInterval(() => {
    if (Date.now() - settleStartedAt > 8000 || !row.isConnected) {
      stopSettle()
      return
    }
    // Every tick refreshes ChatView's settle window (and its arming) so the
    // suppression covers the whole assembly, including remounts.
    window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT))
    const scroller = transcriptScrollerOf(row)
    const height = scroller === null ? 0 : scroller.scrollHeight
    const stable = height === lastHeight
    lastHeight = height
    if (!stable) return
    const rect = row.getBoundingClientRect()
    const spRect = scroller === null ? null : scroller.getBoundingClientRect()
    const spTop = spRect === null ? 0 : spRect.top
    const spBottom = spRect === null ? (row.ownerDocument.documentElement.clientHeight || 768) : spRect.bottom
    if (rect.top < spTop || rect.top > spBottom - 160) {
      centerRow(row, scroller)
      window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT))
    }
  }, 200)
  activeSettleCancel = stopSettle
  window.addEventListener('wheel', stopSettle, { passive: true })
  window.addEventListener('touchstart', stopSettle, { passive: true })
  return true
}

function AttachmentBadges({
  attachments,
  t,
  preview = false,
}: {
  attachments: readonly AttachmentSummary[]
  t: NavigatorPanelProps['t']
  preview?: boolean
}) {
  if (attachments.length === 0) return null
  return (
    <div className={preview ? css.previewAttachments : css.attachments} aria-label={t('preview.attachments')}>
      {attachments.map((attachment, index) => {
        const fallback = attachment.kind === 'image' ? t('attachment.image') : t('attachment.file')
        const label = attachment.name ?? fallback
        return (
          <span
            key={attachment.kind + '-' + (attachment.name ?? 'unnamed') + '-' + String(index)}
            className={css.attachment}
            title={attachment.detail === undefined ? label : label + ' · ' + attachment.detail}
          >
            <span className={css.attachmentIcon} aria-hidden>{attachment.kind === 'image' ? '▧' : '↗'}</span>
            <span>{label}</span>
            {attachment.detail !== undefined && <span className={css.attachmentDetail}>{attachment.detail}</span>}
          </span>
        )
      })}
    </div>
  )
}

const NavigatorQuestionRow = memo(function NavigatorQuestionRow({
  item,
  index,
  t,
  onEnter,
  onLeave,
  onJump,
}: {
  item: QuestionNode
  index: number
  t: NavigatorPanelProps['t']
  onEnter: (key: string, event: React.MouseEvent<HTMLButtonElement>) => void
  onLeave: () => void
  onJump: (key: string) => void
}) {
  const text = questionText(item)
  const attachments = attachmentSummaries(item)
  return (
    <li className={css.row}>
      <button
        type="button"
        className={css.item}
        data-current={index === 0 || undefined}
        title={t('jump.hint')}
        onMouseEnter={(event) => { onEnter(item.key, event) }}
        onMouseLeave={onLeave}
        onClick={() => { onJump(item.key) }}
      >
        <span className={css.itemMeta}>
          <span className={css.itemIndex}>{String(index + 1).padStart(2, '0')}</span>
          <span className={css.itemTime}>{timeLabel(item.data.time)}</span>
          {index === 0 && <span className={css.itemCurrent}>{t('board.current')}</span>}
        </span>
        <span className={css.itemText}>
          {text || (attachments.length > 0 ? t('item.attachmentOnly') : t('item.noText'))}
        </span>
        <AttachmentBadges attachments={attachments} t={t} />
      </button>
    </li>
  )
})

export function NavigatorPanel({ useSession, useSessions, sessionId, t, loadOlder }: NavigatorPanelProps) {
  const chat = useSession(snapshot => snapshot.chat)
  const deferredChat = useDeferredValue(chat)
  const running = useSessions(snapshot => snapshot.byId[sessionId]?.running === true)
  const openState = useSession(snapshot => snapshot.openState)
  const hasMore = useSession(snapshot => snapshot.hasMore === true)
  const loadingOlder = useSession(snapshot => snapshot.loadingOlder === true)
  const jumpRequest = useNavigatorJump(sessionId)
  const [hovered, setHovered] = useState<string | null>(null)
  const [hoverRect, setHoverRect] = useState<{ left: number; top: number } | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_QUESTION_ITEMS)
  const hideTimer = useRef<number | null>(null)
  const loadOlderTimer = useRef<number | null>(null)
  const loadOlderInFlight = useRef(false)
  const loadOlderGeneration = useRef(0)
  const interactingUntil = useRef(0)

  const cancelHide = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])
  const hidePreview = useCallback(() => {
    cancelHide()
    setHovered(null)
    setHoverRect(null)
  }, [cancelHide])
  const requestOlder = useCallback(() => {
    if (openState !== 'open' || !hasMore || loadingOlder || loadOlder === undefined) return
    if (loadOlderTimer.current !== null || loadOlderInFlight.current) return
    loadOlderTimer.current = window.setTimeout(() => {
      loadOlderTimer.current = null
      if (performance.now() < interactingUntil.current) {
        requestOlder()
        return
      }
      loadOlderInFlight.current = true
      const generation = loadOlderGeneration.current
      void loadOlder()
        .catch(() => undefined)
        .finally(() => {
          if (loadOlderGeneration.current === generation) loadOlderInFlight.current = false
        })
    }, 180)
  }, [hasMore, loadOlder, loadingOlder, openState])
  const onListScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    interactingUntil.current = performance.now() + 500
    const list = event.currentTarget
    if (list.scrollHeight - list.scrollTop - list.clientHeight <= 160) requestOlder()
  }, [requestOlder])
  const scheduleHide = useCallback(() => {
    cancelHide()
    hideTimer.current = window.setTimeout(hidePreview, 120)
  }, [cancelHide, hidePreview])
  useEffect(() => () => {
    cancelHide()
    loadOlderGeneration.current += 1
    loadOlderInFlight.current = false
    if (loadOlderTimer.current !== null) {
      window.clearTimeout(loadOlderTimer.current)
      loadOlderTimer.current = null
    }
    activeSettleCancel?.()
  }, [cancelHide])

  // Keep the expensive question projection deferred from the live chat stream.
  // Paging and reconnect frames can arrive in bursts; the chat remains
  // interactive while this lower-priority list catches up.
  const indexed = useMemo(() => {
    // The order is chronological, so walk backwards and stop as soon as the
    // visible cap is full. This avoids rebuilding a map and sorting thousands
    // of historical nodes whenever a streamed assistant frame arrives.
    const rows: QuestionNode[] = []
    for (let index = deferredChat.order.length - 1; index >= 0 && rows.length < MAX_QUESTION_ITEMS; index -= 1) {
      const key = deferredChat.order[index]
      if (key === undefined) continue
      const node = deferredChat.nodes.get(key)
      if (node === undefined) continue
      const question = questionNodeOf(node)
      if (question !== null) rows.push(question)
    }
    rows.sort((left, right) =>
      (right.data.time - left.data.time) || (right.data.seq - left.data.seq))
    return { nodes: deferredChat.nodes, allItems: rows }
  }, [deferredChat])
  const items = indexed.allItems.slice(0, visibleLimit)

  // Open each session with only the newest ten questions. Older pages are
  // requested only until the currently visible page is filled, never eagerly
  // up to the 50-item cap.
  const autoFilledOrderRef = useRef(-1)
  useEffect(() => {
    loadOlderGeneration.current += 1
    loadOlderInFlight.current = false
    if (loadOlderTimer.current !== null) {
      window.clearTimeout(loadOlderTimer.current)
      loadOlderTimer.current = null
    }
    interactingUntil.current = 0
    hidePreview()
    autoFilledOrderRef.current = -1
    setVisibleLimit(INITIAL_QUESTION_ITEMS)
  }, [hidePreview, sessionId])
  useEffect(() => {
    const targetCount = Math.min(visibleLimit, MAX_QUESTION_ITEMS)
    if (indexed.allItems.length >= targetCount || !hasMore) return
    if (autoFilledOrderRef.current === deferredChat.order.length) return
    autoFilledOrderRef.current = deferredChat.order.length
    requestOlder()
  }, [deferredChat.order.length, hasMore, indexed.allItems.length, requestOlder, visibleLimit])

  const canLoadEarlier = visibleLimit < MAX_QUESTION_ITEMS
    && (hasMore || indexed.allItems.length > visibleLimit)
  const loadEarlier = useCallback(() => {
    if (!canLoadEarlier || loadingOlder) return
    const nextLimit = Math.min(MAX_QUESTION_ITEMS, visibleLimit + QUESTION_PAGE_SIZE)
    setVisibleLimit(nextLimit)
    if (indexed.allItems.length < nextLimit) requestOlder()
  }, [canLoadEarlier, indexed.allItems.length, loadingOlder, requestOlder, visibleLimit])

  const requestedQuestion = useMemo(
    () => jumpRequest === null ? null : matchingQuestion(indexed.allItems, jumpRequest.text),
    [indexed.allItems, jumpRequest],
  )

  // Once the target page is available, jump the actual conversation row. The
  // session can report open before the ChatView has committed its first rows,
  // so retain the request briefly instead of completing a false jump.
  useEffect(() => {
    if (jumpRequest === null || openState === 'cold' || openState === 'loading') return
    let cancelled = false
    let retryTimer: number | null = null
    let attempts = 0
    const startedAt = Date.now()
    const attempt = (): void => {
      if (cancelled) return
      if (requestedQuestion !== null) {
        if (jumpToQuestion(requestedQuestion.key, css.flash)) {
          completeNavigatorJump(jumpRequest.sequence)
          return
        }
        if (attempts < 200) {
          attempts += 1
          retryTimer = window.setTimeout(attempt, 50)
        }
        return
      }
      if (hasMore || loadingOlder) {
        if (hasMore && !loadingOlder) requestOlder()
        // History pages are still streaming in; re-check when the projection
        // updates instead of consuming the request prematurely.
        if (attempts < 200) {
          attempts += 1
          retryTimer = window.setTimeout(attempt, 50)
        }
        return
      }
      // History exhausted. A cold session can report exhausted before the
      // first page reaches the deferred projection — wait a bounded grace
      // before concluding the target question is absent.
      if (items.length === 0 && Date.now() - startedAt < 10_000 && attempts < 200) {
        attempts += 1
        retryTimer = window.setTimeout(attempt, 50)
        return
      }
      // A non-empty target must never silently jump to an unrelated question.
      // Empty targets are attachment-only/legacy rows, where the oldest loaded
      // question remains the only meaningful fallback.
      if (normalizedTargetText(jumpRequest.text) === '') {
        const fallback = items[items.length - 1]
        if (fallback !== undefined) jumpToQuestion(fallback.key, css.flash)
      }
      completeNavigatorJump(jumpRequest.sequence)
    }
    attempt()
    return () => {
      cancelled = true
      if (retryTimer !== null) window.clearTimeout(retryTimer)
    }
  }, [jumpRequest, openState, requestedQuestion, hasMore, loadingOlder, items, requestOlder])

  const preview = useMemo<Preview | null>(() => {
    if (hovered === null) return null
    const index = deferredChat.order.indexOf(hovered)
    if (index < 0) return null
    const node = indexed.nodes.get(hovered)
    if (node === undefined) return null
    const question = questionNodeOf(node)
    if (question === null) return null
    const text = questionText(question)
    const attachments = attachmentSummaries(question)
    const reply = replyAfter(indexed.nodes, deferredChat.order, index, question, running)
    return {
      key: hovered,
      text: text || (attachments.length > 0 ? t('item.attachmentOnly') : t('item.noText')),
      attachments,
      reply: reply.text,
      status: reply.status,
      time: question.data.time,
    }
  }, [hovered, deferredChat, indexed, running, t])

  const statusClass = (status: ReplyStatus): string => {
    if (status === 'completed') return css.previewStatusCompleted ?? ''
    if (status === 'interrupted') return css.previewStatusInterrupted ?? ''
    if (status === 'userStopped') return css.previewStatusUserStopped ?? ''
    return css.previewStatusRunning ?? ''
  }

  const statusLabel = (status: ReplyStatus): string => {
    if (status === 'completed') return t('preview.status.completed')
    if (status === 'interrupted') return t('preview.status.interrupted')
    if (status === 'userStopped') return t('preview.status.userStopped')
    return t('preview.status.running')
  }

  const onEnter = useCallback((key: string, event: React.MouseEvent<HTMLButtonElement>) => {
    cancelHide()
    const rect = event.currentTarget.getBoundingClientRect()
    setHovered(key)
    setHoverRect({ left: rect.left, top: rect.top })
  }, [cancelHide])
  const onJump = useCallback((key: string) => {
    jumpToQuestion(key, css.flash)
  }, [])

  if (items.length === 0) {
    return <div className={css.root}><div className={css.empty}>{t('empty.noMessages')}</div></div>
  }

  return (
    <div className={css.root} onMouseLeave={scheduleHide}>
      <div className={css.count}>{t('count', { total: items.length })}</div>
      <ul className={css.list} onScroll={onListScroll}>
        {items.map((item, index) => (
          <NavigatorQuestionRow
            key={item.key}
            item={item}
            index={index}
            t={t}
            onEnter={onEnter}
            onLeave={scheduleHide}
            onJump={onJump}
          />
        ))}
      </ul>
      {canLoadEarlier && (
        <div className={css.loadOlderSlot}>
          <button
            type="button"
            className={css.loadOlder}
            disabled={loadingOlder}
            onClick={loadEarlier}
          >
            {loadingOlder ? t('board.loadingOlder') : t('board.loadOlder')}
          </button>
        </div>
      )}
      {preview !== null && hoverRect !== null && (
        <div
          className={css.preview}
          style={{ left: Math.max(8, hoverRect.left - 296), top: hoverRect.top }}
          role="presentation"
        >
          <div className={css.previewQuestion}>{preview.text}</div>
          <AttachmentBadges attachments={preview.attachments} t={t} preview />
          {preview.reply !== null && <div className={css.previewReply}>{preview.reply}</div>}
          <div className={css.previewStatus + ' ' + statusClass(preview.status)}>
            {statusLabel(preview.status)}
          </div>
        </div>
      )}
    </div>
  )
}
