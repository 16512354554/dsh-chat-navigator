import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client';
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Full composed props: global kit + declared child-slot render face + locale. */
export type NavigatorDockProps = PropsRuntime<'shell.overlay'> & PropsRenderSlots<'chat.navigator.panel'> & PropsLocale<'chat.navigator'> & {
    /** Native session navigation supplied by the root slot inject factory. */
    openSession?: (sessionId: SessionId) => void;
    /** Switch sessions and request an exact question jump after the new chat opens. */
    openSessionAt?: (sessionId: SessionId, targetText: string) => void;
};
/**
 * The right-edge dock. The tab stays mounted; opening mounts the panel over
 * the right edge of the app. Historical sessions are listed independently of
 * the selected session so refreshes that land on a blank New Session do not
 * make persisted conversations appear lost.
 */
export declare function NavigatorDock({ useSessions, renderSlot, t, openSession, openSessionAt }: NavigatorDockProps): import("react").JSX.Element;
//# sourceMappingURL=NavigatorDock.d.ts.map