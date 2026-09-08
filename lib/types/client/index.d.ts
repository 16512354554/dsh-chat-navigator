/**
 * Chat history navigator plugin, browser half. Registers a floating dock into
 * the frame-wide `shell.overlay` list seat (declared by ui-layout), which
 * renders a session-scoped panel body through the outlet (the renderer
 * resolves the current session). The dock stays mounted across sessions; the
 * panel reads the live Chat snapshot, so the question list updates in real
 * time as the conversation streams.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type NavigatorKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /** Session-scoped body of the right chat-history dock. */
        'chat.navigator.panel': {
            kind: 'single';
            scope: 'session';
        };
    }
    interface LocaleNamespaceMap {
        /** The chat history navigator's copy. */
        'chat.navigator': NavigatorKey;
    }
}
/** Required services: slots, locale, and native session navigation. */
export declare const inject: string[];
/**
 * Client plugin body: register the `chat.navigator` dictionaries, the
 * floating dock into shell.overlay (declaring its session-scoped child seat),
 * and the panel into that seat. Both registrations wait on their slot
 * declarations via ctx.slots.inject, so activation order across plugins is
 * irrelevant.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map