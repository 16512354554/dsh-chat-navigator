import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// NavigatorPanel: the session-scoped body of the chat-history dock. Reads the
// current session's Chat snapshot through useSession (live: every streamed
// user/assistant event re-renders it) and renders one row per user question
// (kind 'user' or 'steering'), newest first. Hovering a row shows a floating
// detail preview with text, safe attachment metadata, and the following
// assistant reply; clicking jumps the conversation column to that exact
// message row and flashes it.
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { completeNavigatorJump, useNavigatorJump } from "./NavigatorNavigation.js";
import css from './NavigatorPanel.module.css';
/** The question board keeps at most 50 questions, paged in small UI batches. */
const MAX_QUESTION_ITEMS = 50;
const INITIAL_QUESTION_ITEMS = 10;
const QUESTION_PAGE_SIZE = 5;
/** Narrow a Chat node to a user/steering question (structural; no value import). */
function questionNodeOf(node) {
    if (node.kind !== 'user' && node.kind !== 'steering')
        return null;
    const data = node.data;
    if (typeof data !== 'object' || data === null)
        return null;
    const probe = data;
    if (typeof probe.seq !== 'number' || typeof probe.time !== 'number' || !Array.isArray(probe.content))
        return null;
    return node;
}
/** Concatenated text of one user question's text blocks. */
function questionText(node) {
    return node.data.content
        .filter((block) => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join(' ')
        .trim();
}
function asRecord(value) {
    return typeof value === 'object' && value !== null ? value : undefined;
}
/** Keep names user-facing and never expose opaque ids, paths, or raw bytes. */
function safeDisplayName(value) {
    if (typeof value !== 'string')
        return undefined;
    const normalized = value.trim();
    if (normalized === '')
        return undefined;
    const slash = normalized.split('/').pop() ?? normalized;
    return slash.split(String.fromCharCode(92)).pop() || undefined;
}
function byteDetail(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
        return undefined;
    if (value < 1024)
        return String(Math.round(value)) + ' B';
    if (value < 1024 * 1024)
        return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
}
/** Extract presentation-safe attachment metadata from core and extension blocks. */
function attachmentSummaries(node) {
    const summaries = [];
    for (const raw of node.data.content) {
        const block = asRecord(raw);
        if (block === undefined)
            continue;
        if (block.type === 'image') {
            const attachment = asRecord(block.attachment) ?? block;
            const width = typeof attachment.width === 'number' && Number.isFinite(attachment.width)
                ? Math.round(attachment.width) : undefined;
            const height = typeof attachment.height === 'number' && Number.isFinite(attachment.height)
                ? Math.round(attachment.height) : undefined;
            const dimensions = width !== undefined && height !== undefined
                ? String(width) + '×' + String(height) : undefined;
            summaries.push({ kind: 'image', name: safeDisplayName(attachment.name), detail: dimensions });
            continue;
        }
        // The canonical v1 content union stores images as image blocks. Keep this
        // defensive branch for future/provider extensions that preserve files as
        // structured blocks, without displaying file ids or path-like data.
        if (block.type === 'file' || block.type === 'document' || block.type === 'attachment') {
            const nested = asRecord(block.file);
            summaries.push({
                kind: 'file',
                name: safeDisplayName(block.name)
                    ?? safeDisplayName(block.filename)
                    ?? safeDisplayName(block.fileName)
                    ?? safeDisplayName(nested?.name),
                detail: byteDetail(block.size ?? nested?.size),
            });
        }
    }
    return summaries;
}
/** First assistant text block of the assistant reply following a question. */
function firstReplyText(blocks) {
    if (blocks === undefined)
        return null;
    const block = blocks.find(entry => entry.kind === 'text');
    return block !== undefined && block.kind === 'text' && block.text.trim() !== '' ? block.text.trim() : null;
}
/** Convert the durable turn-end reason into a compact preview status. */
function replyStatusOf(question, running, assistantInterrupted, assistantSettled) {
    const location = question.location;
    // Older fixture/snapshot producers may omit timeline facts; use assistant
    // lifecycle data when available instead of making a settled hover render red.
    if (location === undefined) {
        if (running)
            return 'running';
        return assistantInterrupted ? 'interrupted' : 'completed';
    }
    const turn = location.kind === 'turn' || location.kind === 'step' ? location.turn : undefined;
    const reason = turn?.end?.data.reason;
    if (reason === undefined) {
        if (running)
            return 'running';
        if (assistantInterrupted)
            return 'interrupted';
        if (assistantSettled || location.kind === 'session' || location.kind === 'unresolved')
            return 'completed';
        return 'interrupted';
    }
    if (reason.kind === 'completed')
        return 'completed';
    if (reason.kind === 'aborted' && reason.reason.kind === 'user')
        return 'userStopped';
    return 'interrupted';
}
/** Collect assistant text and preserve the durable question status. */
function replyAfter(nodes, order, fromIndex, question, running) {
    const parts = [];
    let budget = 0;
    let open = true;
    let assistantInterrupted = false;
    let assistantSettled = false;
    for (let i = fromIndex + 1; i < order.length; i += 1) {
        const key = order[i];
        const node = key === undefined ? undefined : nodes.get(key);
        if (node === undefined)
            continue;
        // The next question closes the window: no assistant reply to show.
        if (node.kind === 'user' || node.kind === 'steering') {
            open = false;
            break;
        }
        if (node.kind === 'assistant') {
            const data = node.data;
            assistantInterrupted ||= data.status === 'interrupted';
            assistantSettled ||= data.status === 'settled';
            const text = firstReplyText(data.blocks);
            if (text !== null) {
                parts.push(text);
                budget += text.length;
                if (budget >= 300)
                    break;
            }
        }
    }
    const joined = parts.join(' ').trim();
    return {
        text: joined === '' ? null : joined,
        open,
        status: replyStatusOf(question, running, assistantInterrupted, assistantSettled),
    };
}
/** Local time label: HH:MM, or with the date when not today. */
function timeLabel(time) {
    const date = new Date(time);
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    if (sameDay)
        return hh + ':' + mm;
    return String(date.getMonth() + 1) + '/' + String(date.getDate()) + ' ' + hh + ':' + mm;
}
/** Escape a node key for use inside a quoted attribute selector. */
function escapeAttributeValue(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function')
        return CSS.escape(value);
    const slash = String.fromCharCode(92);
    return value.split(slash).join(slash + slash).replaceAll('"', slash + '"');
}
/** Normalize question/title text for tolerant cross-session matching. */
function normalizedTargetText(value) {
    return value.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}
/** Find the requested question in the currently loaded window. */
function matchingQuestion(items, targetText) {
    const needle = normalizedTargetText(targetText);
    if (needle === '')
        return null;
    return items.find((item) => {
        const text = normalizedTargetText(questionText(item));
        return text === needle || text.includes(needle) || needle.includes(text);
    }) ?? null;
}
/** Window event that opens ChatView's jump settle window (see ChatView). */
const JUMP_SETTLE_EVENT = 'dsh-chat-jump';
// Only the latest jump may keep a settle loop alive. This prevents rapid
// history clicks from leaving several 8-second timers fighting over scrollTop.
let activeSettleCancel = null;
/** Nearest scrollable ancestor of a transcript row (null when none). */
function transcriptScrollerOf(row) {
    let scroller = row.parentElement;
    while (scroller !== null && scroller !== row.ownerDocument.body) {
        const overflow = window.getComputedStyle(scroller).overflowY;
        if (overflow === 'auto' || overflow === 'scroll')
            break;
        scroller = scroller.parentElement;
    }
    return scroller === row.ownerDocument.body ? null : scroller;
}
/** Bring a row's top edge into its scrollport with a small margin: the
 *  anchor element can span the whole turn (question + long answer), so
 *  centering by rect center would leave the question itself off-screen. */
function centerRow(row, scroller) {
    if (scroller === null)
        return;
    const rowRect = row.getBoundingClientRect();
    const spRect = scroller.getBoundingClientRect();
    scroller.scrollTop += (rowRect.top - spRect.top) - 24;
}
/** Scroll the conversation column to a Chat row and flash it. */
function jumpToQuestion(key, flashClass) {
    activeSettleCancel?.();
    activeSettleCancel = null;
    const selector = '[data-chat-anchor-key="' + escapeAttributeValue(key) + '"]';
    const row = document.querySelector(selector);
    if (row === null)
        return false;
    centerRow(row, transcriptScrollerOf(row));
    // Dispatched after the scroll so ChatView arms its preservation anchor at
    // the jumped position and suppresses bottom-follow while the settle window
    // is open.
    window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
    if (flashClass !== undefined) {
        row.classList.add(flashClass);
        window.setTimeout(() => { row.classList.remove(flashClass); }, 1800);
    }
    // The transcript keeps assembling after a cross-session open (history pages
    // and media hydrate for seconds), so a one-shot scroll loses the position —
    // and re-asserting mid-assembly fights the anchored preservation. Instead,
    // wait for the scroll height to stabilise, then re-assert once per stable
    // tick; the reader's own scrolling cancels the loop immediately. The
    // scroller is re-resolved every tick: ChatView remounts it on session
    // switches, so a captured element goes stale and silently drops writes.
    const settleStartedAt = Date.now();
    let lastHeight = -1;
    const stopSettle = () => {
        window.clearInterval(settleTimer);
        window.removeEventListener('wheel', stopSettle);
        window.removeEventListener('touchstart', stopSettle);
        if (activeSettleCancel === stopSettle)
            activeSettleCancel = null;
    };
    const settleTimer = window.setInterval(() => {
        if (Date.now() - settleStartedAt > 8000 || !row.isConnected) {
            stopSettle();
            return;
        }
        // Every tick refreshes ChatView's settle window (and its arming) so the
        // suppression covers the whole assembly, including remounts.
        window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
        const scroller = transcriptScrollerOf(row);
        const height = scroller === null ? 0 : scroller.scrollHeight;
        const stable = height === lastHeight;
        lastHeight = height;
        if (!stable)
            return;
        const rect = row.getBoundingClientRect();
        const spRect = scroller === null ? null : scroller.getBoundingClientRect();
        const spTop = spRect === null ? 0 : spRect.top;
        const spBottom = spRect === null ? (row.ownerDocument.documentElement.clientHeight || 768) : spRect.bottom;
        if (rect.top < spTop || rect.top > spBottom - 160) {
            centerRow(row, scroller);
            window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
        }
    }, 200);
    activeSettleCancel = stopSettle;
    window.addEventListener('wheel', stopSettle, { passive: true });
    window.addEventListener('touchstart', stopSettle, { passive: true });
    return true;
}
function AttachmentBadges({ attachments, t, preview = false, }) {
    if (attachments.length === 0)
        return null;
    return (_jsx("div", { className: preview ? css.previewAttachments : css.attachments, "aria-label": t('preview.attachments'), children: attachments.map((attachment, index) => {
            const fallback = attachment.kind === 'image' ? t('attachment.image') : t('attachment.file');
            const label = attachment.name ?? fallback;
            return (_jsxs("span", { className: css.attachment, title: attachment.detail === undefined ? label : label + ' · ' + attachment.detail, children: [_jsx("span", { className: css.attachmentIcon, "aria-hidden": true, children: attachment.kind === 'image' ? '▧' : '↗' }), _jsx("span", { children: label }), attachment.detail !== undefined && _jsx("span", { className: css.attachmentDetail, children: attachment.detail })] }, attachment.kind + '-' + (attachment.name ?? 'unnamed') + '-' + String(index)));
        }) }));
}
const NavigatorQuestionRow = memo(function NavigatorQuestionRow({ item, index, t, onEnter, onLeave, onJump, }) {
    const text = questionText(item);
    const attachments = attachmentSummaries(item);
    return (_jsx("li", { className: css.row, children: _jsxs("button", { type: "button", className: css.item, "data-current": index === 0 || undefined, title: t('jump.hint'), onMouseEnter: (event) => { onEnter(item.key, event); }, onMouseLeave: onLeave, onClick: () => { onJump(item.key); }, children: [_jsxs("span", { className: css.itemMeta, children: [_jsx("span", { className: css.itemIndex, children: String(index + 1).padStart(2, '0') }), _jsx("span", { className: css.itemTime, children: timeLabel(item.data.time) }), index === 0 && _jsx("span", { className: css.itemCurrent, children: t('board.current') })] }), _jsx("span", { className: css.itemText, children: text || (attachments.length > 0 ? t('item.attachmentOnly') : t('item.noText')) }), _jsx(AttachmentBadges, { attachments: attachments, t: t })] }) }));
});
export function NavigatorPanel({ useSession, useSessions, sessionId, t, loadOlder }) {
    const chat = useSession(snapshot => snapshot.chat);
    const deferredChat = useDeferredValue(chat);
    const running = useSessions(snapshot => snapshot.byId[sessionId]?.running === true);
    const openState = useSession(snapshot => snapshot.openState);
    const hasMore = useSession(snapshot => snapshot.hasMore === true);
    const loadingOlder = useSession(snapshot => snapshot.loadingOlder === true);
    const jumpRequest = useNavigatorJump(sessionId);
    const [hovered, setHovered] = useState(null);
    const [hoverRect, setHoverRect] = useState(null);
    const [visibleLimit, setVisibleLimit] = useState(INITIAL_QUESTION_ITEMS);
    const hideTimer = useRef(null);
    const loadOlderTimer = useRef(null);
    const loadOlderInFlight = useRef(false);
    const interactingUntil = useRef(0);
    const cancelHide = useCallback(() => {
        if (hideTimer.current !== null) {
            window.clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    }, []);
    const hidePreview = useCallback(() => {
        cancelHide();
        setHovered(null);
        setHoverRect(null);
    }, [cancelHide]);
    const requestOlder = useCallback(() => {
        if (openState !== 'open' || !hasMore || loadingOlder || loadOlder === undefined)
            return;
        if (loadOlderTimer.current !== null || loadOlderInFlight.current)
            return;
        loadOlderTimer.current = window.setTimeout(() => {
            loadOlderTimer.current = null;
            if (performance.now() < interactingUntil.current) {
                requestOlder();
                return;
            }
            loadOlderInFlight.current = true;
            void loadOlder()
                .catch(() => undefined)
                .finally(() => {
                loadOlderInFlight.current = false;
            });
        }, 180);
    }, [hasMore, loadOlder, loadingOlder, openState]);
    const onListScroll = useCallback((event) => {
        interactingUntil.current = performance.now() + 500;
        const list = event.currentTarget;
        if (list.scrollHeight - list.scrollTop - list.clientHeight <= 160)
            requestOlder();
    }, [requestOlder]);
    const scheduleHide = useCallback(() => {
        cancelHide();
        hideTimer.current = window.setTimeout(hidePreview, 120);
    }, [cancelHide, hidePreview]);
    useEffect(() => () => {
        cancelHide();
        if (loadOlderTimer.current !== null)
            window.clearTimeout(loadOlderTimer.current);
    }, [cancelHide]);
    // Keep the expensive question projection deferred from the live chat stream.
    // Paging and reconnect frames can arrive in bursts; the chat remains
    // interactive while this lower-priority list catches up.
    const indexed = useMemo(() => {
        // The order is chronological, so walk backwards and stop as soon as the
        // visible cap is full. This avoids rebuilding a map and sorting thousands
        // of historical nodes whenever a streamed assistant frame arrives.
        const rows = [];
        for (let index = deferredChat.order.length - 1; index >= 0 && rows.length < MAX_QUESTION_ITEMS; index -= 1) {
            const key = deferredChat.order[index];
            if (key === undefined)
                continue;
            const node = deferredChat.nodes.get(key);
            if (node === undefined)
                continue;
            const question = questionNodeOf(node);
            if (question !== null)
                rows.push(question);
        }
        rows.sort((left, right) => (right.data.time - left.data.time) || (right.data.seq - left.data.seq));
        return { nodes: deferredChat.nodes, allItems: rows };
    }, [deferredChat]);
    const items = indexed.allItems.slice(0, visibleLimit);
    // Open each session with only the newest ten questions. Older pages are
    // requested only until the currently visible page is filled, never eagerly
    // up to the 50-item cap.
    const autoFilledOrderRef = useRef(-1);
    useEffect(() => {
        autoFilledOrderRef.current = -1;
        setVisibleLimit(INITIAL_QUESTION_ITEMS);
    }, [sessionId]);
    useEffect(() => {
        const targetCount = Math.min(visibleLimit, MAX_QUESTION_ITEMS);
        if (indexed.allItems.length >= targetCount || !hasMore)
            return;
        if (autoFilledOrderRef.current === deferredChat.order.length)
            return;
        autoFilledOrderRef.current = deferredChat.order.length;
        requestOlder();
    }, [deferredChat.order.length, hasMore, indexed.allItems.length, requestOlder, visibleLimit]);
    const canLoadEarlier = visibleLimit < MAX_QUESTION_ITEMS
        && (hasMore || indexed.allItems.length > visibleLimit);
    const loadEarlier = useCallback(() => {
        if (!canLoadEarlier || loadingOlder)
            return;
        const nextLimit = Math.min(MAX_QUESTION_ITEMS, visibleLimit + QUESTION_PAGE_SIZE);
        setVisibleLimit(nextLimit);
        if (indexed.allItems.length < nextLimit)
            requestOlder();
    }, [canLoadEarlier, indexed.allItems.length, loadingOlder, requestOlder, visibleLimit]);
    const requestedQuestion = useMemo(() => jumpRequest === null ? null : matchingQuestion(indexed.allItems, jumpRequest.text), [indexed.allItems, jumpRequest]);
    // Once the target page is available, jump the actual conversation row. The
    // session can report open before the ChatView has committed its first rows,
    // so retain the request briefly instead of completing a false jump.
    useEffect(() => {
        if (jumpRequest === null || openState === 'cold' || openState === 'loading')
            return;
        let cancelled = false;
        let retryTimer = null;
        let attempts = 0;
        const startedAt = Date.now();
        const attempt = () => {
            if (cancelled)
                return;
            if (requestedQuestion !== null) {
                if (jumpToQuestion(requestedQuestion.key, css.flash)) {
                    completeNavigatorJump(jumpRequest.sequence);
                    return;
                }
                if (attempts < 200) {
                    attempts += 1;
                    retryTimer = window.setTimeout(attempt, 50);
                }
                return;
            }
            if (hasMore || loadingOlder) {
                if (hasMore && !loadingOlder)
                    requestOlder();
                // History pages are still streaming in; re-check when the projection
                // updates instead of consuming the request prematurely.
                if (attempts < 200) {
                    attempts += 1;
                    retryTimer = window.setTimeout(attempt, 50);
                }
                return;
            }
            // History exhausted. A cold session can report exhausted before the
            // first page reaches the deferred projection — wait a bounded grace
            // before concluding the target question is absent.
            if (items.length === 0 && Date.now() - startedAt < 10_000 && attempts < 200) {
                attempts += 1;
                retryTimer = window.setTimeout(attempt, 50);
                return;
            }
            // A non-empty target must never silently jump to an unrelated question.
            // Empty targets are attachment-only/legacy rows, where the oldest loaded
            // question remains the only meaningful fallback.
            if (normalizedTargetText(jumpRequest.text) === '') {
                const fallback = items[items.length - 1];
                if (fallback !== undefined)
                    jumpToQuestion(fallback.key, css.flash);
            }
            completeNavigatorJump(jumpRequest.sequence);
        };
        attempt();
        return () => {
            cancelled = true;
            if (retryTimer !== null)
                window.clearTimeout(retryTimer);
        };
    }, [jumpRequest, openState, requestedQuestion, hasMore, loadingOlder, items, requestOlder]);
    const preview = useMemo(() => {
        if (hovered === null)
            return null;
        const index = deferredChat.order.indexOf(hovered);
        if (index < 0)
            return null;
        const node = indexed.nodes.get(hovered);
        if (node === undefined)
            return null;
        const question = questionNodeOf(node);
        if (question === null)
            return null;
        const text = questionText(question);
        const attachments = attachmentSummaries(question);
        const reply = replyAfter(indexed.nodes, deferredChat.order, index, question, running);
        return {
            key: hovered,
            text: text || (attachments.length > 0 ? t('item.attachmentOnly') : t('item.noText')),
            attachments,
            reply: reply.text,
            status: reply.status,
            time: question.data.time,
        };
    }, [hovered, deferredChat, indexed, running, t]);
    const statusClass = (status) => {
        if (status === 'completed')
            return css.previewStatusCompleted ?? '';
        if (status === 'interrupted')
            return css.previewStatusInterrupted ?? '';
        if (status === 'userStopped')
            return css.previewStatusUserStopped ?? '';
        return css.previewStatusRunning ?? '';
    };
    const statusLabel = (status) => {
        if (status === 'completed')
            return t('preview.status.completed');
        if (status === 'interrupted')
            return t('preview.status.interrupted');
        if (status === 'userStopped')
            return t('preview.status.userStopped');
        return t('preview.status.running');
    };
    const onEnter = useCallback((key, event) => {
        cancelHide();
        const rect = event.currentTarget.getBoundingClientRect();
        setHovered(key);
        setHoverRect({ left: rect.left, top: rect.top });
    }, [cancelHide]);
    const onJump = useCallback((key) => {
        jumpToQuestion(key, css.flash);
    }, []);
    if (items.length === 0) {
        return _jsx("div", { className: css.root, children: _jsx("div", { className: css.empty, children: t('empty.noMessages') }) });
    }
    return (_jsxs("div", { className: css.root, onMouseLeave: scheduleHide, children: [_jsx("div", { className: css.count, children: t('count', { total: items.length }) }), _jsx("ul", { className: css.list, onScroll: onListScroll, children: items.map((item, index) => (_jsx(NavigatorQuestionRow, { item: item, index: index, t: t, onEnter: onEnter, onLeave: scheduleHide, onJump: onJump }, item.key))) }), canLoadEarlier && (_jsx("div", { className: css.loadOlderSlot, children: _jsx("button", { type: "button", className: css.loadOlder, disabled: loadingOlder, onClick: loadEarlier, children: loadingOlder ? t('board.loadingOlder') : t('board.loadOlder') }) })), preview !== null && hoverRect !== null && (_jsxs("div", { className: css.preview, style: { left: Math.max(8, hoverRect.left - 296), top: hoverRect.top }, role: "presentation", children: [_jsx("div", { className: css.previewQuestion, children: preview.text }), _jsx(AttachmentBadges, { attachments: preview.attachments, t: t, preview: true }), preview.reply !== null && _jsx("div", { className: css.previewReply, children: preview.reply }), _jsx("div", { className: css.previewStatus + ' ' + statusClass(preview.status), children: statusLabel(preview.status) })] }))] }));
}
//# sourceMappingURL=NavigatorPanel.js.map