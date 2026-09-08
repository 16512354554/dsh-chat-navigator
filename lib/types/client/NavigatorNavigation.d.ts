import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client';
/** A cross-session jump requested by a history card. */
export interface NavigatorJumpRequest {
    sequence: number;
    sessionId: SessionId;
    /** Session title or question text used to identify the target row after open. */
    text: string;
}
/** Queue a target before switching sessions so the new session can consume it. */
export declare function requestNavigatorJump(sessionId: SessionId, text: string): void;
/** Mark a target consumed; stale requests must not fire when returning later. */
export declare function completeNavigatorJump(sequence: number): void;
/** Read the pending request for one session as a live React hook. */
export declare function useNavigatorJump(sessionId: SessionId): NavigatorJumpRequest | null;
//# sourceMappingURL=NavigatorNavigation.d.ts.map