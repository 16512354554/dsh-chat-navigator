// NavigatorDock: the frame-wide floating entry (shell.overlay). Owns the
// open/closed toggle and a compact cross-session history picker. The selected
// session's question list is rendered through the declared session-scoped seat.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {
  PropsLocale, PropsRenderSlots, PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import { requestNavigatorJump } from './NavigatorNavigation.ts'
import css from './NavigatorDock.module.css'

/** Full composed props: global kit + declared child-slot render face + locale. */
export type NavigatorDockProps =
  & PropsRuntime<'shell.overlay'>
  & PropsRenderSlots<'chat.navigator.panel'>
  & PropsLocale<'chat.navigator'>
  & {
    /** Native session navigation supplied by the root slot inject factory. */
    openSession?: (sessionId: SessionId) => void
    /** Switch sessions and request an exact question jump after the new chat opens. */
    openSessionAt?: (sessionId: SessionId, targetText: string) => void
  }

const MIN_HISTORY_HEIGHT = 112
const MAX_HISTORY_HEIGHT = 420
const MAX_HISTORY_ITEMS = 50
const HISTORY_KEYBOARD_STEP = 16

function clampHistoryHeight(value: number): number {
  const viewportMax = typeof window === 'undefined'
    ? MAX_HISTORY_HEIGHT
    : Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, Math.round(window.innerHeight * 0.65)))
  return Math.min(viewportMax, Math.max(MIN_HISTORY_HEIGHT, Math.round(value)))
}

/** Show only the final directory segment, never the full project path. */
function projectNameOf(cwd: string | undefined): string {
  if (cwd === undefined || cwd.trim() === '') return ''
  const normalized = cwd.trim().split(String.fromCharCode(92)).join('/')
  return normalized.split('/').filter(Boolean).pop() ?? ''
}

/** Session card timestamp: always includes hour and minute. */
function sessionTimeLabel(time: number): string {
  if (!Number.isFinite(time) || time <= 0) return '—'
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return month + '/' + day + ' ' + hour + ':' + minute
}

/**
 * The right-edge dock. The tab stays mounted; opening mounts the panel over
 * the right edge of the app. Historical sessions are listed independently of
 * the selected session so refreshes that land on a blank New Session do not
 * make persisted conversations appear lost.
 */
export function NavigatorDock({ useSessions, renderSlot, t, openSession, openSessionAt }: NavigatorDockProps) {
  const [open, setOpen] = useState(false)
  const sessionState = useSessions((state) => state)
  const resizeCleanup = useRef<(() => void) | null>(null)
  const historyHeightRef = useRef(220)
  const pendingHeightRef = useRef(220)
  const liveFrameRef = useRef<number | null>(null)
  const historySectionRef = useRef<HTMLElement | null>(null)
  const historyListRef = useRef<HTMLDivElement | null>(null)
  const resizeHandleRef = useRef<HTMLDivElement | null>(null)
  // A blank session is still active: the session-scoped panel renders its own
  // "no questions yet" state. Only a missing or stale current id uses the
  // no-session hint.
  const active = sessionState.current !== undefined
    && sessionState.byId[sessionState.current] !== undefined

  const history = useMemo(() => {
    const ids = Array.isArray(sessionState.ids)
      ? sessionState.ids
      : Object.keys(sessionState.byId) as SessionId[]
    return ids
      .flatMap((id) => {
        const summary = sessionState.byId[id]
        return summary !== undefined && summary.blank !== true ? [{ id, summary }] : []
      })
      .sort((left, right) => (right.summary.updatedAt ?? 0) - (left.summary.updatedAt ?? 0))
      .slice(0, MAX_HISTORY_ITEMS)
  }, [sessionState])

  const applyHistoryHeight = (value: number): number => {
    const next = clampHistoryHeight(value)
    historyHeightRef.current = next
    pendingHeightRef.current = next
    historySectionRef.current?.style.setProperty('height', next + 'px')
    resizeHandleRef.current?.setAttribute('aria-valuenow', String(next))
    return next
  }

  const commitHistoryHeight = (value: number): void => {
    applyHistoryHeight(value)
  }

  const flushLiveHeight = (): void => {
    if (liveFrameRef.current !== null) {
      window.cancelAnimationFrame(liveFrameRef.current)
      liveFrameRef.current = null
    }
    commitHistoryHeight(pendingHeightRef.current)
  }

  useEffect(() => () => {
    resizeCleanup.current?.()
    if (liveFrameRef.current !== null) window.cancelAnimationFrame(liveFrameRef.current)
  }, [])

  // Opening the dock (or switching sessions while it stays open) must show
  // where the user currently is: bring the active conversation's row into
  // view. Deliberate manual scrolling afterwards is never corrected because
  // the effect only runs on open/current changes, not on history ticks.
  useEffect(() => {
    if (!open) return
    const list = historyListRef.current
    const row = list?.querySelector<HTMLElement>('[aria-current="page"]') ?? null
    if (list === null || row === null) return
    const listRect = list.getBoundingClientRect()
    const rowRect = row.getBoundingClientRect()
    if (rowRect.top < listRect.top) {
      list.scrollTop += rowRect.top - listRect.top
    } else if (rowRect.bottom > listRect.bottom) {
      list.scrollTop += rowRect.bottom - listRect.bottom
    }
  }, [open, sessionState.current])

  const onResizePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    resizeCleanup.current?.()
    const startY = event.clientY
    const startHeight = historyHeightRef.current
    const onMove = (move: PointerEvent) => {
      pendingHeightRef.current = clampHistoryHeight(startHeight + move.clientY - startY)
      if (liveFrameRef.current !== null) return
      liveFrameRef.current = window.requestAnimationFrame(() => {
        liveFrameRef.current = null
        applyHistoryHeight(pendingHeightRef.current)
      })
    }
    const onUp = () => {
      resizeCleanup.current?.()
    }
    const cleanup = () => {
      flushLiveHeight()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (document.body.style.cursor === 'row-resize') document.body.style.cursor = ''
      if (resizeCleanup.current === cleanup) resizeCleanup.current = null
    }
    resizeCleanup.current = cleanup
    document.body.style.cursor = 'row-resize'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const onResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      commitHistoryHeight(historyHeightRef.current + HISTORY_KEYBOARD_STEP)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      commitHistoryHeight(historyHeightRef.current - HISTORY_KEYBOARD_STEP)
    } else if (event.key === 'Home') {
      event.preventDefault()
      commitHistoryHeight(MIN_HISTORY_HEIGHT)
    } else if (event.key === 'End') {
      event.preventDefault()
      commitHistoryHeight(MAX_HISTORY_HEIGHT)
    }
  }

  return (
    <div className={css.dock} data-open={open || undefined} data-active={active || undefined}>
      {open && (
        <div className={css.panel}>
          <div className={css.panelHeader}>
            <span className={css.panelTitle}>{t('dock.title')}</span>
          </div>
          {history.length > 0 && (
            <>
              <section
                ref={historySectionRef}
                className={css.historySection}
                aria-label={t('history.title')}
              >
                <div className={css.historyHeader}>
                  <span>{t('history.title')}</span>
                  <span className={css.historyCount}>{history.length}</span>
                </div>
                <div ref={historyListRef} className={css.historyList}>
                  {history.map((session) => {
                    const prompt = session.summary.lastPrompt
                    const title = prompt !== undefined
                      ? (prompt === '' ? t('history.attachmentQuestion') : prompt)
                      : session.summary.displayTitle || session.summary.title || String(session.id)
                    const project = projectNameOf(session.summary.cwd)
                    const current = session.id === sessionState.current
                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={css.historyItem}
                        data-session-id={String(session.id)}
                        aria-current={current ? 'page' : undefined}
                        title={t('history.open')}
                        onClick={() => {
                          const targetText = session.summary.lastPrompt
                            ?? session.summary.title
                            ?? ''
                          if (openSessionAt !== undefined) {
                            openSessionAt(session.id, targetText)
                          } else {
                            if (targetText !== '') requestNavigatorJump(session.id, targetText)
                            openSession?.(session.id)
                          }
                        }}
                      >
                        <span className={css.historyItemBody}>
                          <span className={css.historyItemTitle}>{title}</span>
                          <span className={css.historyItemMeta}>
                            <span>{project || t('history.projectUnknown')}</span>
                            <span>{sessionTimeLabel(session.summary.updatedAt)}</span>
                          </span>
                        </span>
                        {current && <span className={css.historyCurrent}>{t('history.current')}</span>}
                      </button>
                    )
                  })}
                </div>
              </section>
              <div
                ref={resizeHandleRef}
                className={css.resizeHandle}
                role="separator"
                tabIndex={0}
                aria-label={t('history.resize')}
                aria-orientation="horizontal"
                aria-valuemin={MIN_HISTORY_HEIGHT}
                aria-valuemax={MAX_HISTORY_HEIGHT}
                aria-valuenow={historyHeightRef.current}
                onPointerDown={onResizePointerDown}
                onKeyDown={onResizeKeyDown}
              >
                <span aria-hidden />
              </div>
            </>
          )}
          <div className={css.panelBody}>
            {active
              ? renderSlot('chat.navigator.panel', {})
              : <div className={css.panelEmpty}>{t('empty.noSession')}</div>}
          </div>
        </div>
      )}
      <button
        type="button"
        className={css.tab}
        aria-label={t(open ? 'dock.close' : 'dock.open')}
        aria-expanded={open}
        title={t(open ? 'dock.close' : 'dock.open')}
        onClick={() => { setOpen((value) => !value) }}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <path
            d={open ? 'M6 4l4 4-4 4' : 'M10 4L6 8l4 4'}
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
      </button>
    </div>
  )
}
