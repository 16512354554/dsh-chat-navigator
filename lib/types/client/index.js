import { NavigatorDock } from "./NavigatorDock.js";
import { requestNavigatorJump } from "./NavigatorNavigation.js";
import { NavigatorPanel } from "./NavigatorPanel.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'chat.navigator';
/** Required services: slots, locale, and native session navigation. */
export const inject = ['slots', 'locale', 'sessions'];
/**
 * Client plugin body: register the `chat.navigator` dictionaries, the
 * floating dock into shell.overlay (declaring its session-scoped child seat),
 * and the panel into that seat. Both registrations wait on their slot
 * declarations via ctx.slots.inject, so activation order across plugins is
 * irrelevant.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const sessions = ctx.get('sessions');
    if (sessions === undefined)
        throw new Error('ui-chat-navigator: sessions service unavailable');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-chat-navigator: dictionaries');
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'chat-navigator',
        order: 0,
        locale: NS,
        children: {
            'chat.navigator.panel': { kind: 'single', scope: 'session' },
        },
        inject: () => ({
            openSession: (sessionId) => { void sessions.open(sessionId); },
            openSessionAt: (sessionId, targetText) => {
                requestNavigatorJump(sessionId, targetText);
                void sessions.open(sessionId);
            },
        }),
    }, NavigatorDock));
    ctx.slots.inject('chat.navigator.panel', () => ctx.slots.register({
        name: 'chat.navigator.panel',
        locale: NS,
        inject: (sessionId) => ({
            loadOlder: () => sessions.binding(sessionId)?.session.loadOlder() ?? Promise.resolve(),
        }),
    }, NavigatorPanel));
}
//# sourceMappingURL=index.js.map