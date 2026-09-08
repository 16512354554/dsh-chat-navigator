import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// NavigatorDock: the frame-wide floating entry (shell.overlay). Owns the
// open/closed toggle and a compact cross-session history picker. The selected
// session's question list is rendered through the declared session-scoped seat.
import { useEffect, useMemo, useRef, useState } from 'react';
import { requestNavigatorJump } from "./NavigatorNavigation.js";
import css from './NavigatorDock.module.css';
const MIN_HISTORY_HEIGHT = 112;
const MAX_HISTORY_HEIGHT = 420;
const MAX_HISTORY_ITEMS = 50;
const HISTORY_KEYBOARD_STEP = 16;
function clampHistoryHeight(value) {
    const viewportMax = typeof window === 'undefined'
        ? MAX_HISTORY_HEIGHT
        : Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, Math.round(window.innerHeight * 0.65)));
    return Math.min(viewportMax, Math.max(MIN_HISTORY_HEIGHT, Math.round(value)));
}
/** Show only the final directory segment, never the full project path. */
function projectNameOf(cwd) {
    if (cwd === undefined || cwd.trim() === '')
        return '';
    const normalized = cwd.trim().split(String.fromCharCode(92)).join('/');
    return normalized.split('/').filter(Boolean).pop() ?? '';
}
/** Session card timestamp: always includes hour and minute. */
function sessionTimeLabel(time) {
    if (!Number.isFinite(time) || time <= 0)
        return '—';
    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return month + '/' + day + ' ' + hour + ':' + minute;
}
/**
 * The right-edge dock. The tab stays mounted; opening mounts the panel over
 * the right edge of the app. Historical sessions are listed independently of
 * the selected session so refreshes that land on a blank New Session do not
 * make persisted conversations appear lost.
 */
export function NavigatorDock({ useSessions, renderSlot, t, openSession, openSessionAt }) {
    const [open, setOpen] = useState(false);
    const sessionState = useSessions((state) => state);
    const resizeCleanup = useRef(null);
    const historyHeightRef = useRef(220);
    const pendingHeightRef = useRef(220);
    const liveFrameRef = useRef(null);
    const historySectionRef = useRef(null);
    const historyListRef = useRef(null);
    const resizeHandleRef = useRef(null);
    // A blank session is still active: the session-scoped panel renders its own
    // "no questions yet" state. Only a missing or stale current id uses the
    // no-session hint.
    const active = sessionState.current !== undefined
        && sessionState.byId[sessionState.current] !== undefined;
    const history = useMemo(() => {
        const ids = Array.isArray(sessionState.ids)
            ? sessionState.ids
            : Object.keys(sessionState.byId);
        return ids
            .flatMap((id) => {
            const summary = sessionState.byId[id];
            return summary !== undefined && summary.blank !== true ? [{ id, summary }] : [];
        })
            .sort((left, right) => (right.summary.updatedAt ?? 0) - (left.summary.updatedAt ?? 0))
            .slice(0, MAX_HISTORY_ITEMS);
    }, [sessionState]);
    const applyHistoryHeight = (value) => {
        const next = clampHistoryHeight(value);
        historyHeightRef.current = next;
        pendingHeightRef.current = next;
        historySectionRef.current?.style.setProperty('height', next + 'px');
        resizeHandleRef.current?.setAttribute('aria-valuenow', String(next));
        return next;
    };
    const commitHistoryHeight = (value) => {
        applyHistoryHeight(value);
    };
    const flushLiveHeight = () => {
        if (liveFrameRef.current !== null) {
            window.cancelAnimationFrame(liveFrameRef.current);
            liveFrameRef.current = null;
        }
        commitHistoryHeight(pendingHeightRef.current);
    };
    useEffect(() => () => {
        resizeCleanup.current?.();
        if (liveFrameRef.current !== null)
            window.cancelAnimationFrame(liveFrameRef.current);
    }, []);
    // Opening the dock (or switching sessions while it stays open) must show
    // where the user currently is: bring the active conversation's row into
    // view. Deliberate manual scrolling afterwards is never corrected because
    // the effect only runs on open/current changes, not on history ticks.
    useEffect(() => {
        if (!open)
            return;
        const list = historyListRef.current;
        const row = list?.querySelector('[aria-current="page"]') ?? null;
        if (list === null || row === null)
            return;
        const listRect = list.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        if (rowRect.top < listRect.top) {
            list.scrollTop += rowRect.top - listRect.top;
        }
        else if (rowRect.bottom > listRect.bottom) {
            list.scrollTop += rowRect.bottom - listRect.bottom;
        }
    }, [open, sessionState.current]);
    const onResizePointerDown = (event) => {
        event.preventDefault();
        resizeCleanup.current?.();
        const startY = event.clientY;
        const startHeight = historyHeightRef.current;
        const onMove = (move) => {
            pendingHeightRef.current = clampHistoryHeight(startHeight + move.clientY - startY);
            if (liveFrameRef.current !== null)
                return;
            liveFrameRef.current = window.requestAnimationFrame(() => {
                liveFrameRef.current = null;
                applyHistoryHeight(pendingHeightRef.current);
            });
        };
        const onUp = () => {
            resizeCleanup.current?.();
        };
        const cleanup = () => {
            flushLiveHeight();
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (document.body.style.cursor === 'row-resize')
                document.body.style.cursor = '';
            if (resizeCleanup.current === cleanup)
                resizeCleanup.current = null;
        };
        resizeCleanup.current = cleanup;
        document.body.style.cursor = 'row-resize';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
    };
    const onResizeKeyDown = (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            commitHistoryHeight(historyHeightRef.current + HISTORY_KEYBOARD_STEP);
        }
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            commitHistoryHeight(historyHeightRef.current - HISTORY_KEYBOARD_STEP);
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            commitHistoryHeight(MIN_HISTORY_HEIGHT);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            commitHistoryHeight(MAX_HISTORY_HEIGHT);
        }
    };
    return (_jsxs("div", { className: css.dock, "data-open": open || undefined, "data-active": active || undefined, children: [open && (_jsxs("div", { className: css.panel, children: [_jsx("div", { className: css.panelHeader, children: _jsx("span", { className: css.panelTitle, children: t('dock.title') }) }), history.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("section", { ref: historySectionRef, className: css.historySection, "aria-label": t('history.title'), children: [_jsxs("div", { className: css.historyHeader, children: [_jsx("span", { children: t('history.title') }), _jsx("span", { className: css.historyCount, children: history.length })] }), _jsx("div", { ref: historyListRef, className: css.historyList, children: history.map((session) => {
                                            const prompt = session.summary.lastPrompt;
                                            const title = prompt !== undefined
                                                ? (prompt === '' ? t('history.attachmentQuestion') : prompt)
                                                : session.summary.displayTitle || session.summary.title || String(session.id);
                                            const project = projectNameOf(session.summary.cwd);
                                            const current = session.id === sessionState.current;
                                            return (_jsxs("button", { type: "button", className: css.historyItem, "data-session-id": String(session.id), "aria-current": current ? 'page' : undefined, title: t('history.open'), onClick: () => {
                                                    const targetText = session.summary.lastPrompt
                                                        ?? session.summary.title
                                                        ?? '';
                                                    if (openSessionAt !== undefined) {
                                                        openSessionAt(session.id, targetText);
                                                    }
                                                    else {
                                                        if (targetText !== '')
                                                            requestNavigatorJump(session.id, targetText);
                                                        openSession?.(session.id);
                                                    }
                                                }, children: [_jsxs("span", { className: css.historyItemBody, children: [_jsx("span", { className: css.historyItemTitle, children: title }), _jsxs("span", { className: css.historyItemMeta, children: [_jsx("span", { children: project || t('history.projectUnknown') }), _jsx("span", { children: sessionTimeLabel(session.summary.updatedAt) })] })] }), current && _jsx("span", { className: css.historyCurrent, children: t('history.current') })] }, session.id));
                                        }) })] }), _jsx("div", { ref: resizeHandleRef, className: css.resizeHandle, role: "separator", tabIndex: 0, "aria-label": t('history.resize'), "aria-orientation": "horizontal", "aria-valuemin": MIN_HISTORY_HEIGHT, "aria-valuemax": MAX_HISTORY_HEIGHT, "aria-valuenow": historyHeightRef.current, onPointerDown: onResizePointerDown, onKeyDown: onResizeKeyDown, children: _jsx("span", { "aria-hidden": true }) })] })), _jsx("div", { className: css.panelBody, children: active
                            ? renderSlot('chat.navigator.panel', {})
                            : _jsx("div", { className: css.panelEmpty, children: t('empty.noSession') }) })] })), _jsx("button", { type: "button", className: css.tab, "aria-label": t(open ? 'dock.close' : 'dock.open'), "aria-expanded": open, title: t(open ? 'dock.close' : 'dock.open'), onClick: () => { setOpen((value) => !value); }, children: _jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": true, children: _jsx("path", { d: open ? 'M6 4l4 4-4 4' : 'M10 4L6 8l4 4', stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }) }) })] }));
}
//# sourceMappingURL=NavigatorDock.js.map