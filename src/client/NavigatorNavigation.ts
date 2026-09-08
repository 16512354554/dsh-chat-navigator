import { useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'

/** A cross-session jump requested by a history card. */
export interface NavigatorJumpRequest {
  sequence: number
  sessionId: SessionId
  /** Session title or question text used to identify the target row after open. */
  text: string
}

let revision = 0
let nextSequence = 0
let current: NavigatorJumpRequest | null = null
const listeners = new Set<() => void>()

function notify(): void {
  revision += 1
  for (const listener of listeners) listener()
}

/** Queue a target before switching sessions so the new session can consume it. */
export function requestNavigatorJump(sessionId: SessionId, text: string): void {
  current = { sequence: ++nextSequence, sessionId, text }
  notify()
}

/** Mark a target consumed; stale requests must not fire when returning later. */
export function completeNavigatorJump(sequence: number): void {
  if (current?.sequence !== sequence) return
  current = null
  notify()
}

/** Read the pending request for one session as a live React hook. */
export function useNavigatorJump(sessionId: SessionId): NavigatorJumpRequest | null {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    () => revision,
    () => 0,
  )
  return current?.sessionId === sessionId ? current : null
}
