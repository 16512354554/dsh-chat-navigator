import { useSyncExternalStore } from 'react';
let revision = 0;
let nextSequence = 0;
let current = null;
const listeners = new Set();
function notify() {
    revision += 1;
    for (const listener of listeners)
        listener();
}
/** Queue a target before switching sessions so the new session can consume it. */
export function requestNavigatorJump(sessionId, text) {
    current = { sequence: ++nextSequence, sessionId, text };
    notify();
}
/** Mark a target consumed; stale requests must not fire when returning later. */
export function completeNavigatorJump(sequence) {
    if (current?.sequence !== sequence)
        return;
    current = null;
    notify();
}
/** Read the pending request for one session as a live React hook. */
export function useNavigatorJump(sessionId) {
    useSyncExternalStore((listener) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, () => revision, () => 0);
    return current?.sessionId === sessionId ? current : null;
}
//# sourceMappingURL=NavigatorNavigation.js.map