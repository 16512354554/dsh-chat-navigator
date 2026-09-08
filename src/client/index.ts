/**
 * Chat history navigator plugin, browser half. Registers a floating dock into
 * the frame-wide `shell.overlay` list seat (declared by ui-layout), which
 * renders a session-scoped panel body through the outlet (the renderer
 * resolves the current session). The dock stays mounted across sessions; the
 * panel reads the live Chat snapshot, so the question list updates in real
 * time as the conversation streams.
 */
import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the SlotMap merges (shell.overlay) and ctx.layout.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { NavigatorDock } from './NavigatorDock.tsx'
import { requestNavigatorJump } from './NavigatorNavigation.ts'
import { NavigatorPanel } from './NavigatorPanel.tsx'
import { en, zh, type NavigatorKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Session-scoped body of the right chat-history dock. */
    'chat.navigator.panel': { kind: 'single'; scope: 'session' }
  }
  interface LocaleNamespaceMap {
    /** The chat history navigator's copy. */
    'chat.navigator': NavigatorKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'chat.navigator'

/** Required services: slots, locale, and native session navigation. */
export const inject = ['slots', 'locale', 'sessions']

/**
 * Client plugin body: register the `chat.navigator` dictionaries, the
 * floating dock into shell.overlay (declaring its session-scoped child seat),
 * and the panel into that seat. Both registrations wait on their slot
 * declarations via ctx.slots.inject, so activation order across plugins is
 * irrelevant.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const sessions = ctx.get('sessions')
  if (sessions === undefined) throw new Error('ui-chat-navigator: sessions service unavailable')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-chat-navigator: dictionaries')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    {
      name: 'shell.overlay',
      id: 'chat-navigator',
      order: 0,
      locale: NS,
      children: {
        'chat.navigator.panel': { kind: 'single', scope: 'session' },
      },
      inject: () => ({
        openSession: (sessionId: SessionId) => { void sessions.open(sessionId) },
        openSessionAt: (sessionId: SessionId, targetText: string) => {
          requestNavigatorJump(sessionId, targetText)
          void sessions.open(sessionId)
        },
      }),
    },
    NavigatorDock,
  ))

  ctx.slots.inject('chat.navigator.panel', () => ctx.slots.register(
    {
      name: 'chat.navigator.panel',
      locale: NS,
      inject: (sessionId: SessionId) => ({
        loadOlder: () => sessions.binding(sessionId)?.session.loadOlder() ?? Promise.resolve(),
      }),
    },
    NavigatorPanel,
  ))
}
