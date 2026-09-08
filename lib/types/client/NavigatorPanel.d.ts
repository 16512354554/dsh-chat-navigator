import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Full composed props: session standard kit + global kit + locale. */
export type NavigatorPanelProps = PropsRuntime<'chat.navigator.panel'> & PropsLocale<'chat.navigator'> & {
    /** Loads older pages while resolving a cross-session question target. */
    loadOlder?: () => Promise<void>;
};
export declare function NavigatorPanel({ useSession, useSessions, sessionId, t, loadOlder }: NavigatorPanelProps): import("react").JSX.Element;
//# sourceMappingURL=NavigatorPanel.d.ts.map