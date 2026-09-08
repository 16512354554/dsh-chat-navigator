window.__ModuleLoader__.load({
	id: "dsh-chat-navigator",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/NavigatorNavigation.ts
		let revision = 0;
		let nextSequence = 0;
		let current = null;
		const listeners = /* @__PURE__ */ new Set();
		function notify() {
			revision += 1;
			for (const listener of listeners) listener();
		}
		/** Queue a target before switching sessions so the new session can consume it. */
		function requestNavigatorJump(sessionId, text) {
			current = {
				sequence: ++nextSequence,
				sessionId,
				text
			};
			notify();
		}
		/** Mark a target consumed; stale requests must not fire when returning later. */
		function completeNavigatorJump(sequence) {
			if (current?.sequence !== sequence) return;
			current = null;
			notify();
		}
		/** Read the pending request for one session as a live React hook. */
		function useNavigatorJump(sessionId) {
			(0, react.useSyncExternalStore)((listener) => {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			}, () => revision, () => 0);
			return current?.sessionId === sessionId ? current : null;
		}
		//#endregion
		//#region \0dsh-css:D:\deepseek-harness\packages\client\ui-chat-navigator\src\client\NavigatorDock.module.css.mjs
		const css$1 = ".eW_4tq_dock{z-index:30;pointer-events:none;align-items:stretch;display:flex;position:absolute;top:0;bottom:0;right:0}.eW_4tq_dock>*{pointer-events:auto}.eW_4tq_tab{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-floating-fill);width:26px;height:88px;color:var(--dsw-alias-label-tertiary);cursor:pointer;transition:background var(--ds-transition-duration-fast,.12s) ease-out, color var(--ds-transition-duration-fast,.12s) ease-out;border-radius:14px;justify-content:center;align-self:center;align-items:center;margin-right:6px;display:flex;box-shadow:0 4px 12px #0000001a}.eW_4tq_tab:hover{background:var(--dsw-alias-button-floating-hover);color:var(--dsw-alias-label-primary)}.eW_4tq_panel{background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l2);transform-origin:100%;width:320px;max-width:78vw;height:100%;animation:eW_4tq_navigatorPanelIn var(--ds-transition-duration-normal,.18s) cubic-bezier(.22, 1, .36, 1);flex-direction:column;display:flex;box-shadow:-8px 0 24px #0000001f}.eW_4tq_panelHeader{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;align-items:center;padding:10px 14px;display:flex}.eW_4tq_panelTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.eW_4tq_historySection{contain:layout paint;will-change:height;flex-direction:column;flex:none;height:220px;min-height:0;padding:8px 8px 10px;display:flex;overflow:hidden}.eW_4tq_historyHeader{color:var(--dsw-alias-label-tertiary);align-items:center;gap:6px;padding:0 6px 5px;font-size:11px;font-weight:600;display:flex}.eW_4tq_historyCount{background:var(--dsw-alias-fill-tertiary,#7f7f7f1a);text-align:center;font-variant-numeric:tabular-nums;border-radius:8px;min-width:16px;padding:1px 4px}.eW_4tq_historyList{overscroll-behavior:contain;flex-direction:column;flex:1;gap:2px;min-height:0;display:flex;overflow-y:auto}.eW_4tq_historyItem{width:100%;min-width:0;color:var(--dsw-alias-label-secondary);text-align:left;cursor:pointer;transition:background-color var(--ds-transition-duration-fast,.12s) ease-out, color var(--ds-transition-duration-fast,.12s) ease-out, box-shadow var(--ds-transition-duration-fast,.12s) ease-out;background:0 0;border:0;border-radius:7px;align-items:center;gap:6px;padding:6px 8px;display:flex}.eW_4tq_historyItem:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.eW_4tq_historyItem[aria-current=page]{background:var(--dsw-alias-interactive-bg-hover-accent,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-label-primary);box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary)}.eW_4tq_historyItemBody{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.eW_4tq_historyItemTitle{text-overflow:ellipsis;-webkit-line-clamp:2;line-clamp:2;white-space:normal;-webkit-box-orient:vertical;min-width:0;font-size:12px;line-height:16px;display:-webkit-box;overflow:hidden}.eW_4tq_historyItemMeta{min-width:0;color:var(--dsw-alias-label-tertiary);gap:8px;font-size:10px;line-height:14px;display:flex;overflow:hidden}.eW_4tq_historyItemMeta span{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.eW_4tq_historyCurrent{color:var(--dsw-alias-brand-primary);flex:none;margin-left:auto;font-size:10px;font-weight:600}.eW_4tq_resizeHandle{border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-fill-tertiary,#7f7f7f0f);cursor:row-resize;touch-action:none;user-select:none;height:8px;transition:background-color var(--ds-transition-duration-fast,.12s) ease-out;flex:none;justify-content:center;align-items:center;display:flex}.eW_4tq_resizeHandle:hover,.eW_4tq_resizeHandle:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}.eW_4tq_resizeHandle>span{background:var(--dsw-alias-label-quaternary,var(--dsw-alias-label-tertiary));border-radius:2px;width:34px;height:2px}.eW_4tq_panelBody{flex-direction:column;flex:1;min-height:0;display:flex}@keyframes eW_4tq_navigatorPanelIn{0%{opacity:0;transform:translate(12px)}to{opacity:1;transform:translate(0,0)}}@media (prefers-reduced-motion:reduce){.eW_4tq_panel,.eW_4tq_historyItem,.eW_4tq_resizeHandle,.eW_4tq_tab{transition:none;animation:none}}";
		const tagId$1 = "dsh-chat-navigator/NavigatorDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-chat-navigator";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var NavigatorDock_module_css_default = {
			"dock": "eW_4tq_dock",
			"historyCount": "eW_4tq_historyCount",
			"historyCurrent": "eW_4tq_historyCurrent",
			"historyHeader": "eW_4tq_historyHeader",
			"historyItem": "eW_4tq_historyItem",
			"historyItemBody": "eW_4tq_historyItemBody",
			"historyItemMeta": "eW_4tq_historyItemMeta",
			"historyItemTitle": "eW_4tq_historyItemTitle",
			"historyList": "eW_4tq_historyList",
			"historySection": "eW_4tq_historySection",
			"navigatorPanelIn": "eW_4tq_navigatorPanelIn",
			"panel": "eW_4tq_panel",
			"panelBody": "eW_4tq_panelBody",
			"panelHeader": "eW_4tq_panelHeader",
			"panelTitle": "eW_4tq_panelTitle",
			"resizeHandle": "eW_4tq_resizeHandle",
			"tab": "eW_4tq_tab"
		};
		//#endregion
		//#region src/client/NavigatorDock.tsx
		const MIN_HISTORY_HEIGHT = 112;
		const MAX_HISTORY_HEIGHT = 420;
		const MAX_HISTORY_ITEMS = 50;
		const HISTORY_KEYBOARD_STEP = 16;
		function clampHistoryHeight(value) {
			const viewportMax = typeof window === "undefined" ? MAX_HISTORY_HEIGHT : Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, Math.round(window.innerHeight * .65)));
			return Math.min(viewportMax, Math.max(MIN_HISTORY_HEIGHT, Math.round(value)));
		}
		/** Show only the final directory segment, never the full project path. */
		function projectNameOf(cwd) {
			if (cwd === void 0 || cwd.trim() === "") return "";
			return cwd.trim().split(String.fromCharCode(92)).join("/").split("/").filter(Boolean).pop() ?? "";
		}
		/** Session card timestamp: always includes hour and minute. */
		function sessionTimeLabel(time) {
			if (!Number.isFinite(time) || time <= 0) return "—";
			const date = new Date(time);
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hour = String(date.getHours()).padStart(2, "0");
			const minute = String(date.getMinutes()).padStart(2, "0");
			return month + "/" + day + " " + hour + ":" + minute;
		}
		/**
		* The right-edge dock. The tab stays mounted; opening mounts the panel over
		* the right edge of the app. Historical sessions are listed independently of
		* the selected session so refreshes that land on a blank New Session do not
		* make persisted conversations appear lost.
		*/
		function NavigatorDock({ useSessions, renderSlot, t, openSession, openSessionAt }) {
			const [open, setOpen] = (0, react.useState)(false);
			const sessionState = useSessions((state) => state);
			const resizeCleanup = (0, react.useRef)(null);
			const historyHeightRef = (0, react.useRef)(220);
			const pendingHeightRef = (0, react.useRef)(220);
			const liveFrameRef = (0, react.useRef)(null);
			const historySectionRef = (0, react.useRef)(null);
			const historyListRef = (0, react.useRef)(null);
			const resizeHandleRef = (0, react.useRef)(null);
			const active = sessionState.current !== void 0 && sessionState.byId[sessionState.current] !== void 0;
			const history = (0, react.useMemo)(() => {
				return (Array.isArray(sessionState.ids) ? sessionState.ids : Object.keys(sessionState.byId)).flatMap((id) => {
					const summary = sessionState.byId[id];
					return summary !== void 0 && summary.blank !== true ? [{
						id,
						summary
					}] : [];
				}).sort((left, right) => (right.summary.updatedAt ?? 0) - (left.summary.updatedAt ?? 0)).slice(0, MAX_HISTORY_ITEMS);
			}, [sessionState]);
			const applyHistoryHeight = (value) => {
				const next = clampHistoryHeight(value);
				historyHeightRef.current = next;
				pendingHeightRef.current = next;
				historySectionRef.current?.style.setProperty("height", next + "px");
				resizeHandleRef.current?.setAttribute("aria-valuenow", String(next));
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
			(0, react.useEffect)(() => () => {
				resizeCleanup.current?.();
				if (liveFrameRef.current !== null) window.cancelAnimationFrame(liveFrameRef.current);
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				const list = historyListRef.current;
				const row = list?.querySelector("[aria-current=\"page\"]") ?? null;
				if (list === null || row === null) return;
				const listRect = list.getBoundingClientRect();
				const rowRect = row.getBoundingClientRect();
				if (rowRect.top < listRect.top) list.scrollTop += rowRect.top - listRect.top;
				else if (rowRect.bottom > listRect.bottom) list.scrollTop += rowRect.bottom - listRect.bottom;
			}, [open, sessionState.current]);
			const onResizePointerDown = (event) => {
				event.preventDefault();
				resizeCleanup.current?.();
				const startY = event.clientY;
				const startHeight = historyHeightRef.current;
				const onMove = (move) => {
					pendingHeightRef.current = clampHistoryHeight(startHeight + move.clientY - startY);
					if (liveFrameRef.current !== null) return;
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
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
					if (document.body.style.cursor === "row-resize") document.body.style.cursor = "";
					if (resizeCleanup.current === cleanup) resizeCleanup.current = null;
				};
				resizeCleanup.current = cleanup;
				document.body.style.cursor = "row-resize";
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp, { once: true });
			};
			const onResizeKeyDown = (event) => {
				if (event.key === "ArrowDown" || event.key === "ArrowRight") {
					event.preventDefault();
					commitHistoryHeight(historyHeightRef.current + HISTORY_KEYBOARD_STEP);
				} else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
					event.preventDefault();
					commitHistoryHeight(historyHeightRef.current - HISTORY_KEYBOARD_STEP);
				} else if (event.key === "Home") {
					event.preventDefault();
					commitHistoryHeight(MIN_HISTORY_HEIGHT);
				} else if (event.key === "End") {
					event.preventDefault();
					commitHistoryHeight(MAX_HISTORY_HEIGHT);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: NavigatorDock_module_css_default.dock,
				"data-open": open || void 0,
				"data-active": active || void 0,
				children: [open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: NavigatorDock_module_css_default.panel,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NavigatorDock_module_css_default.panelHeader,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: NavigatorDock_module_css_default.panelTitle,
								children: t("dock.title")
							})
						}),
						history.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							ref: historySectionRef,
							className: NavigatorDock_module_css_default.historySection,
							"aria-label": t("history.title"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: NavigatorDock_module_css_default.historyHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("history.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: NavigatorDock_module_css_default.historyCount,
									children: history.length
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								ref: historyListRef,
								className: NavigatorDock_module_css_default.historyList,
								children: history.map((session) => {
									const prompt = session.summary.lastPrompt;
									const title = prompt !== void 0 ? prompt === "" ? t("history.attachmentQuestion") : prompt : session.summary.displayTitle || session.summary.title || String(session.id);
									const project = projectNameOf(session.summary.cwd);
									const current = session.id === sessionState.current;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: NavigatorDock_module_css_default.historyItem,
										"data-session-id": String(session.id),
										"aria-current": current ? "page" : void 0,
										title: t("history.open"),
										onClick: () => {
											const targetText = session.summary.lastPrompt ?? session.summary.title ?? "";
											if (openSessionAt !== void 0) openSessionAt(session.id, targetText);
											else {
												if (targetText !== "") requestNavigatorJump(session.id, targetText);
												openSession?.(session.id);
											}
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: NavigatorDock_module_css_default.historyItemBody,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: NavigatorDock_module_css_default.historyItemTitle,
												children: title
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: NavigatorDock_module_css_default.historyItemMeta,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: project || t("history.projectUnknown") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: sessionTimeLabel(session.summary.updatedAt) })]
											})]
										}), current && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: NavigatorDock_module_css_default.historyCurrent,
											children: t("history.current")
										})]
									}, session.id);
								})
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							ref: resizeHandleRef,
							className: NavigatorDock_module_css_default.resizeHandle,
							role: "separator",
							tabIndex: 0,
							"aria-label": t("history.resize"),
							"aria-orientation": "horizontal",
							"aria-valuemin": MIN_HISTORY_HEIGHT,
							"aria-valuemax": MAX_HISTORY_HEIGHT,
							"aria-valuenow": historyHeightRef.current,
							onPointerDown: onResizePointerDown,
							onKeyDown: onResizeKeyDown,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { "aria-hidden": true })
						})] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: NavigatorDock_module_css_default.panelBody,
							children: active ? renderSlot("chat.navigator.panel", {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: NavigatorDock_module_css_default.panelEmpty,
								children: t("empty.noSession")
							})
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: NavigatorDock_module_css_default.tab,
					"aria-label": t(open ? "dock.close" : "dock.open"),
					"aria-expanded": open,
					title: t(open ? "dock.close" : "dock.open"),
					onClick: () => {
						setOpen((value) => !value);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 16 16",
						width: "14",
						height: "14",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: open ? "M6 4l4 4-4 4" : "M10 4L6 8l4 4",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							fill: "none"
						})
					})
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\deepseek-harness\packages\client\ui-chat-navigator\src\client\NavigatorPanel.module.css.mjs
		const css = ".vivAKa_root{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.vivAKa_count{color:var(--dsw-alias-label-tertiary);flex:none;padding:8px 14px 4px;font-size:12px}.vivAKa_list{scrollbar-gutter:stable;overscroll-behavior:contain;flex:1;min-height:0;margin:0;padding:4px 8px 12px;list-style:none;overflow-y:auto}.vivAKa_row{contain:layout paint;content-visibility:auto;contain-intrinsic-size:72px}.vivAKa_loadOlderSlot{flex:none;justify-content:center;padding:4px 8px 10px;display:flex}.vivAKa_loadOlder{border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-fill-tertiary,#7f7f7f14);cursor:pointer;transition:background-color var(--ds-transition-duration-fast,.14s) ease-out, color var(--ds-transition-duration-fast,.14s) ease-out, opacity var(--ds-transition-duration-fast,.14s) ease-out, transform var(--ds-transition-duration-fast,.14s) ease-out;border-radius:12px;padding:4px 12px;font-size:12px;line-height:16px}.vivAKa_loadOlder:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.vivAKa_loadOlder:disabled{cursor:default;opacity:.6}.vivAKa_item{text-align:left;cursor:pointer;width:100%;transition:background-color var(--ds-transition-duration-fast,.14s) ease-out, color var(--ds-transition-duration-fast,.14s) ease-out, box-shadow var(--ds-transition-duration-fast,.14s) ease-out, transform var(--ds-transition-duration-fast,.14s) ease-out;background:0 0;border:none;border-radius:10px;flex-direction:column;gap:3px;padding:8px 10px;display:flex}.vivAKa_item:hover{background:var(--dsw-alias-interactive-bg-hover);transform:translate(-1px)}.vivAKa_item[data-current]{background:var(--dsw-alias-interactive-bg-hover-accent,var(--dsw-alias-interactive-bg-hover));box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary)}.vivAKa_item:active{background:var(--dsw-alias-interactive-bg-active)}.vivAKa_itemMeta{color:var(--dsw-alias-label-tertiary);align-items:center;gap:6px;font-size:11px;line-height:16px;display:flex}.vivAKa_itemIndex{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);font-weight:600}.vivAKa_itemKind{margin-left:auto}.vivAKa_itemCurrent{color:var(--dsw-alias-brand-primary);flex:none;margin-left:auto;font-size:10px;font-weight:600;line-height:14px}.vivAKa_itemText{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;overflow-wrap:normal;min-width:0;font-size:13px;line-height:1.45;display:block;overflow:hidden}.vivAKa_attachments,.vivAKa_previewAttachments{flex-wrap:wrap;gap:4px;max-height:20px;display:flex;overflow:hidden}.vivAKa_attachment{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-fill-tertiary,#7f7f7f14);max-width:100%;color:var(--dsw-alias-label-secondary);border-radius:6px;align-items:center;gap:4px;padding:2px 6px;font-size:11px;line-height:16px;display:inline-flex;overflow:hidden}.vivAKa_attachmentIcon{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px}.vivAKa_attachmentDetail{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none}.vivAKa_previewAttachments{margin:0 0 8px}.vivAKa_empty{color:var(--dsw-alias-label-tertiary);flex:1;justify-content:center;align-items:center;padding:16px;font-size:13px;display:flex}.vivAKa_preview{z-index:60;contain:layout paint;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));pointer-events:none;transform-origin:100% 0;width:288px;max-height:45vh;animation:vivAKa_navigatorPreviewIn var(--ds-transition-duration-fast,.14s) cubic-bezier(.22, 1, .36, 1);border-radius:12px;flex-direction:column;gap:6px;padding:10px 12px;display:flex;position:fixed;overflow:hidden;box-shadow:0 10px 28px #0000002e}.vivAKa_previewQuestion{-webkit-line-clamp:3;line-clamp:3;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;-webkit-box-orient:vertical;font-size:12px;line-height:1.5;display:-webkit-box;overflow:hidden}.vivAKa_previewReply{-webkit-line-clamp:3;line-clamp:3;color:var(--dsw-alias-label-primary);white-space:normal;overflow-wrap:anywhere;-webkit-box-orient:vertical;font-size:13px;line-height:1.55;display:-webkit-box;overflow:hidden}.vivAKa_previewStatus{flex:none;font-size:11px;font-weight:600;line-height:16px}.vivAKa_previewStatusRunning{color:var(--dsw-alias-label-tertiary)}.vivAKa_previewStatusCompleted{color:#2e8b57}.vivAKa_previewStatusInterrupted{color:#d93025}.vivAKa_previewStatusUserStopped{color:#2563eb}.vivAKa_flash{animation:1.8s ease-out vivAKa_chatNavigatorFlash}@keyframes vivAKa_navigatorPreviewIn{0%{opacity:0;transform:translate(8px)scale(.98)}to{opacity:1;transform:translate(0,0)scale(1)}}@media (prefers-reduced-motion:reduce){.vivAKa_item,.vivAKa_loadOlder,.vivAKa_preview,.vivAKa_flash{transition:none;animation:none}}@keyframes vivAKa_chatNavigatorFlash{0%{background-color:var(--dsw-alias-state-warning-bg,#ffb4284d)}to{background-color:#0000}}";
		const tagId = "dsh-chat-navigator/NavigatorPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-chat-navigator";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var NavigatorPanel_module_css_default = {
			"attachment": "vivAKa_attachment",
			"attachmentDetail": "vivAKa_attachmentDetail",
			"attachmentIcon": "vivAKa_attachmentIcon",
			"attachments": "vivAKa_attachments",
			"chatNavigatorFlash": "vivAKa_chatNavigatorFlash",
			"count": "vivAKa_count",
			"empty": "vivAKa_empty",
			"flash": "vivAKa_flash",
			"item": "vivAKa_item",
			"itemCurrent": "vivAKa_itemCurrent",
			"itemIndex": "vivAKa_itemIndex",
			"itemKind": "vivAKa_itemKind",
			"itemMeta": "vivAKa_itemMeta",
			"itemText": "vivAKa_itemText",
			"list": "vivAKa_list",
			"loadOlder": "vivAKa_loadOlder",
			"loadOlderSlot": "vivAKa_loadOlderSlot",
			"navigatorPreviewIn": "vivAKa_navigatorPreviewIn",
			"preview": "vivAKa_preview",
			"previewAttachments": "vivAKa_previewAttachments",
			"previewQuestion": "vivAKa_previewQuestion",
			"previewReply": "vivAKa_previewReply",
			"previewStatus": "vivAKa_previewStatus",
			"previewStatusCompleted": "vivAKa_previewStatusCompleted",
			"previewStatusInterrupted": "vivAKa_previewStatusInterrupted",
			"previewStatusRunning": "vivAKa_previewStatusRunning",
			"previewStatusUserStopped": "vivAKa_previewStatusUserStopped",
			"root": "vivAKa_root",
			"row": "vivAKa_row"
		};
		//#endregion
		//#region src/client/NavigatorPanel.tsx
		/** The question board keeps at most 50 questions, paged in small UI batches. */
		const MAX_QUESTION_ITEMS = 50;
		const INITIAL_QUESTION_ITEMS = 10;
		const QUESTION_PAGE_SIZE = 5;
		/** Narrow a Chat node to a user/steering question (structural; no value import). */
		function questionNodeOf(node) {
			if (node.kind !== "user" && node.kind !== "steering") return null;
			const data = node.data;
			if (typeof data !== "object" || data === null) return null;
			const probe = data;
			if (typeof probe.seq !== "number" || typeof probe.time !== "number" || !Array.isArray(probe.content)) return null;
			return node;
		}
		/** Concatenated text of one user question's text blocks. */
		function questionText(node) {
			return node.data.content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join(" ").trim();
		}
		function asRecord(value) {
			return typeof value === "object" && value !== null ? value : void 0;
		}
		/** Keep names user-facing and never expose opaque ids, paths, or raw bytes. */
		function safeDisplayName(value) {
			if (typeof value !== "string") return void 0;
			const normalized = value.trim();
			if (normalized === "") return void 0;
			return (normalized.split("/").pop() ?? normalized).split(String.fromCharCode(92)).pop() || void 0;
		}
		function byteDetail(value) {
			if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return void 0;
			if (value < 1024) return String(Math.round(value)) + " B";
			if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
			return (value / (1024 * 1024)).toFixed(1) + " MB";
		}
		/** Extract presentation-safe attachment metadata from core and extension blocks. */
		function attachmentSummaries(node) {
			const summaries = [];
			for (const raw of node.data.content) {
				const block = asRecord(raw);
				if (block === void 0) continue;
				if (block.type === "image") {
					const attachment = asRecord(block.attachment) ?? block;
					const width = typeof attachment.width === "number" && Number.isFinite(attachment.width) ? Math.round(attachment.width) : void 0;
					const height = typeof attachment.height === "number" && Number.isFinite(attachment.height) ? Math.round(attachment.height) : void 0;
					const dimensions = width !== void 0 && height !== void 0 ? String(width) + "×" + String(height) : void 0;
					summaries.push({
						kind: "image",
						name: safeDisplayName(attachment.name),
						detail: dimensions
					});
					continue;
				}
				if (block.type === "file" || block.type === "document" || block.type === "attachment") {
					const nested = asRecord(block.file);
					summaries.push({
						kind: "file",
						name: safeDisplayName(block.name) ?? safeDisplayName(block.filename) ?? safeDisplayName(block.fileName) ?? safeDisplayName(nested?.name),
						detail: byteDetail(block.size ?? nested?.size)
					});
				}
			}
			return summaries;
		}
		/** First assistant text block of the assistant reply following a question. */
		function firstReplyText(blocks) {
			if (blocks === void 0) return null;
			const block = blocks.find((entry) => entry.kind === "text");
			return block !== void 0 && block.kind === "text" && block.text.trim() !== "" ? block.text.trim() : null;
		}
		/** Convert the durable turn-end reason into a compact preview status. */
		function replyStatusOf(question, running, assistantInterrupted, assistantSettled) {
			const location = question.location;
			if (location === void 0) {
				if (running) return "running";
				return assistantInterrupted ? "interrupted" : "completed";
			}
			const reason = (location.kind === "turn" || location.kind === "step" ? location.turn : void 0)?.end?.data.reason;
			if (reason === void 0) {
				if (running) return "running";
				if (assistantInterrupted) return "interrupted";
				if (assistantSettled || location.kind === "session" || location.kind === "unresolved") return "completed";
				return "interrupted";
			}
			if (reason.kind === "completed") return "completed";
			if (reason.kind === "aborted" && reason.reason.kind === "user") return "userStopped";
			return "interrupted";
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
				const node = key === void 0 ? void 0 : nodes.get(key);
				if (node === void 0) continue;
				if (node.kind === "user" || node.kind === "steering") {
					open = false;
					break;
				}
				if (node.kind === "assistant") {
					const data = node.data;
					assistantInterrupted ||= data.status === "interrupted";
					assistantSettled ||= data.status === "settled";
					const text = firstReplyText(data.blocks);
					if (text !== null) {
						parts.push(text);
						budget += text.length;
						if (budget >= 300) break;
					}
				}
			}
			const joined = parts.join(" ").trim();
			return {
				text: joined === "" ? null : joined,
				open,
				status: replyStatusOf(question, running, assistantInterrupted, assistantSettled)
			};
		}
		/** Local time label: HH:MM, or with the date when not today. */
		function timeLabel(time) {
			const date = new Date(time);
			const now = /* @__PURE__ */ new Date();
			const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
			const hh = String(date.getHours()).padStart(2, "0");
			const mm = String(date.getMinutes()).padStart(2, "0");
			if (sameDay) return hh + ":" + mm;
			return String(date.getMonth() + 1) + "/" + String(date.getDate()) + " " + hh + ":" + mm;
		}
		/** Escape a node key for use inside a quoted attribute selector. */
		function escapeAttributeValue(value) {
			if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
			const slash = String.fromCharCode(92);
			return value.split(slash).join("\\\\").replaceAll("\"", "\\\"");
		}
		/** Normalize question/title text for tolerant cross-session matching. */
		function normalizedTargetText(value) {
			return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase();
		}
		/** Find the requested question in the currently loaded window. */
		function matchingQuestion(items, targetText) {
			const needle = normalizedTargetText(targetText);
			if (needle === "") return null;
			return items.find((item) => {
				const text = normalizedTargetText(questionText(item));
				return text === needle || text.includes(needle) || needle.includes(text);
			}) ?? null;
		}
		/** Window event that opens ChatView's jump settle window (see ChatView). */
		const JUMP_SETTLE_EVENT = "dsh-chat-jump";
		let activeSettleCancel = null;
		/** Nearest scrollable ancestor of a transcript row (null when none). */
		function transcriptScrollerOf(row) {
			let scroller = row.parentElement;
			while (scroller !== null && scroller !== row.ownerDocument.body) {
				const overflow = window.getComputedStyle(scroller).overflowY;
				if (overflow === "auto" || overflow === "scroll") break;
				scroller = scroller.parentElement;
			}
			return scroller === row.ownerDocument.body ? null : scroller;
		}
		/** Bring a row's top edge into its scrollport with a small margin: the
		*  anchor element can span the whole turn (question + long answer), so
		*  centering by rect center would leave the question itself off-screen. */
		function centerRow(row, scroller) {
			if (scroller === null) return;
			const rowRect = row.getBoundingClientRect();
			const spRect = scroller.getBoundingClientRect();
			scroller.scrollTop += rowRect.top - spRect.top - 24;
		}
		/** Scroll the conversation column to a Chat row and flash it. */
		function jumpToQuestion(key, flashClass) {
			activeSettleCancel?.();
			activeSettleCancel = null;
			const selector = "[data-chat-anchor-key=\"" + escapeAttributeValue(key) + "\"]";
			const row = document.querySelector(selector);
			if (row === null) return false;
			centerRow(row, transcriptScrollerOf(row));
			window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
			if (flashClass !== void 0) {
				row.classList.add(flashClass);
				window.setTimeout(() => {
					row.classList.remove(flashClass);
				}, 1800);
			}
			const settleStartedAt = Date.now();
			let lastHeight = -1;
			const stopSettle = () => {
				window.clearInterval(settleTimer);
				window.removeEventListener("wheel", stopSettle);
				window.removeEventListener("touchstart", stopSettle);
				if (activeSettleCancel === stopSettle) activeSettleCancel = null;
			};
			const settleTimer = window.setInterval(() => {
				if (Date.now() - settleStartedAt > 8e3 || !row.isConnected) {
					stopSettle();
					return;
				}
				window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
				const scroller = transcriptScrollerOf(row);
				const height = scroller === null ? 0 : scroller.scrollHeight;
				const stable = height === lastHeight;
				lastHeight = height;
				if (!stable) return;
				const rect = row.getBoundingClientRect();
				const spRect = scroller === null ? null : scroller.getBoundingClientRect();
				const spTop = spRect === null ? 0 : spRect.top;
				const spBottom = spRect === null ? row.ownerDocument.documentElement.clientHeight || 768 : spRect.bottom;
				if (rect.top < spTop || rect.top > spBottom - 160) {
					centerRow(row, scroller);
					window.dispatchEvent(new CustomEvent(JUMP_SETTLE_EVENT));
				}
			}, 200);
			activeSettleCancel = stopSettle;
			window.addEventListener("wheel", stopSettle, { passive: true });
			window.addEventListener("touchstart", stopSettle, { passive: true });
			return true;
		}
		function AttachmentBadges({ attachments, t, preview = false }) {
			if (attachments.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: preview ? NavigatorPanel_module_css_default.previewAttachments : NavigatorPanel_module_css_default.attachments,
				"aria-label": t("preview.attachments"),
				children: attachments.map((attachment, index) => {
					const fallback = attachment.kind === "image" ? t("attachment.image") : t("attachment.file");
					const label = attachment.name ?? fallback;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: NavigatorPanel_module_css_default.attachment,
						title: attachment.detail === void 0 ? label : label + " · " + attachment.detail,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: NavigatorPanel_module_css_default.attachmentIcon,
								"aria-hidden": true,
								children: attachment.kind === "image" ? "▧" : "↗"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }),
							attachment.detail !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: NavigatorPanel_module_css_default.attachmentDetail,
								children: attachment.detail
							})
						]
					}, attachment.kind + "-" + (attachment.name ?? "unnamed") + "-" + String(index));
				})
			});
		}
		const NavigatorQuestionRow = (0, react.memo)(function NavigatorQuestionRow({ item, index, t, onEnter, onLeave, onJump }) {
			const text = questionText(item);
			const attachments = attachmentSummaries(item);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
				className: NavigatorPanel_module_css_default.row,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: NavigatorPanel_module_css_default.item,
					"data-current": index === 0 || void 0,
					title: t("jump.hint"),
					onMouseEnter: (event) => {
						onEnter(item.key, event);
					},
					onMouseLeave: onLeave,
					onClick: () => {
						onJump(item.key);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: NavigatorPanel_module_css_default.itemMeta,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: NavigatorPanel_module_css_default.itemIndex,
									children: String(index + 1).padStart(2, "0")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: NavigatorPanel_module_css_default.itemTime,
									children: timeLabel(item.data.time)
								}),
								index === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: NavigatorPanel_module_css_default.itemCurrent,
									children: t("board.current")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: NavigatorPanel_module_css_default.itemText,
							children: text || (attachments.length > 0 ? t("item.attachmentOnly") : t("item.noText"))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AttachmentBadges, {
							attachments,
							t
						})
					]
				})
			});
		});
		function NavigatorPanel({ useSession, useSessions, sessionId, t, loadOlder }) {
			const deferredChat = (0, react.useDeferredValue)(useSession((snapshot) => snapshot.chat));
			const running = useSessions((snapshot) => snapshot.byId[sessionId]?.running === true);
			const openState = useSession((snapshot) => snapshot.openState);
			const hasMore = useSession((snapshot) => snapshot.hasMore === true);
			const loadingOlder = useSession((snapshot) => snapshot.loadingOlder === true);
			const jumpRequest = useNavigatorJump(sessionId);
			const [hovered, setHovered] = (0, react.useState)(null);
			const [hoverRect, setHoverRect] = (0, react.useState)(null);
			const [visibleLimit, setVisibleLimit] = (0, react.useState)(INITIAL_QUESTION_ITEMS);
			const hideTimer = (0, react.useRef)(null);
			const loadOlderTimer = (0, react.useRef)(null);
			const loadOlderInFlight = (0, react.useRef)(false);
			const loadOlderGeneration = (0, react.useRef)(0);
			const interactingUntil = (0, react.useRef)(0);
			const cancelHide = (0, react.useCallback)(() => {
				if (hideTimer.current !== null) {
					window.clearTimeout(hideTimer.current);
					hideTimer.current = null;
				}
			}, []);
			const hidePreview = (0, react.useCallback)(() => {
				cancelHide();
				setHovered(null);
				setHoverRect(null);
			}, [cancelHide]);
			const requestOlder = (0, react.useCallback)(() => {
				if (openState !== "open" || !hasMore || loadingOlder || loadOlder === void 0) return;
				if (loadOlderTimer.current !== null || loadOlderInFlight.current) return;
				loadOlderTimer.current = window.setTimeout(() => {
					loadOlderTimer.current = null;
					if (performance.now() < interactingUntil.current) {
						requestOlder();
						return;
					}
					loadOlderInFlight.current = true;
					const generation = loadOlderGeneration.current;
					loadOlder().catch(() => void 0).finally(() => {
						if (loadOlderGeneration.current === generation) loadOlderInFlight.current = false;
					});
				}, 180);
			}, [
				hasMore,
				loadOlder,
				loadingOlder,
				openState
			]);
			const onListScroll = (0, react.useCallback)((event) => {
				interactingUntil.current = performance.now() + 500;
				const list = event.currentTarget;
				if (list.scrollHeight - list.scrollTop - list.clientHeight <= 160) requestOlder();
			}, [requestOlder]);
			const scheduleHide = (0, react.useCallback)(() => {
				cancelHide();
				hideTimer.current = window.setTimeout(hidePreview, 120);
			}, [cancelHide, hidePreview]);
			(0, react.useEffect)(() => () => {
				cancelHide();
				loadOlderGeneration.current += 1;
				loadOlderInFlight.current = false;
				if (loadOlderTimer.current !== null) {
					window.clearTimeout(loadOlderTimer.current);
					loadOlderTimer.current = null;
				}
				activeSettleCancel?.();
			}, [cancelHide]);
			const indexed = (0, react.useMemo)(() => {
				const rows = [];
				for (let index = deferredChat.order.length - 1; index >= 0 && rows.length < MAX_QUESTION_ITEMS; index -= 1) {
					const key = deferredChat.order[index];
					if (key === void 0) continue;
					const node = deferredChat.nodes.get(key);
					if (node === void 0) continue;
					const question = questionNodeOf(node);
					if (question !== null) rows.push(question);
				}
				rows.sort((left, right) => right.data.time - left.data.time || right.data.seq - left.data.seq);
				return {
					nodes: deferredChat.nodes,
					allItems: rows
				};
			}, [deferredChat]);
			const items = indexed.allItems.slice(0, visibleLimit);
			const autoFilledOrderRef = (0, react.useRef)(-1);
			(0, react.useEffect)(() => {
				loadOlderGeneration.current += 1;
				loadOlderInFlight.current = false;
				if (loadOlderTimer.current !== null) {
					window.clearTimeout(loadOlderTimer.current);
					loadOlderTimer.current = null;
				}
				interactingUntil.current = 0;
				hidePreview();
				autoFilledOrderRef.current = -1;
				setVisibleLimit(INITIAL_QUESTION_ITEMS);
			}, [hidePreview, sessionId]);
			(0, react.useEffect)(() => {
				const targetCount = Math.min(visibleLimit, MAX_QUESTION_ITEMS);
				if (indexed.allItems.length >= targetCount || !hasMore) return;
				if (autoFilledOrderRef.current === deferredChat.order.length) return;
				autoFilledOrderRef.current = deferredChat.order.length;
				requestOlder();
			}, [
				deferredChat.order.length,
				hasMore,
				indexed.allItems.length,
				requestOlder,
				visibleLimit
			]);
			const canLoadEarlier = visibleLimit < MAX_QUESTION_ITEMS && (hasMore || indexed.allItems.length > visibleLimit);
			const loadEarlier = (0, react.useCallback)(() => {
				if (!canLoadEarlier || loadingOlder) return;
				const nextLimit = Math.min(MAX_QUESTION_ITEMS, visibleLimit + QUESTION_PAGE_SIZE);
				setVisibleLimit(nextLimit);
				if (indexed.allItems.length < nextLimit) requestOlder();
			}, [
				canLoadEarlier,
				indexed.allItems.length,
				loadingOlder,
				requestOlder,
				visibleLimit
			]);
			const requestedQuestion = (0, react.useMemo)(() => jumpRequest === null ? null : matchingQuestion(indexed.allItems, jumpRequest.text), [indexed.allItems, jumpRequest]);
			(0, react.useEffect)(() => {
				if (jumpRequest === null || openState === "cold" || openState === "loading") return;
				let cancelled = false;
				let retryTimer = null;
				let attempts = 0;
				const startedAt = Date.now();
				const attempt = () => {
					if (cancelled) return;
					if (requestedQuestion !== null) {
						if (jumpToQuestion(requestedQuestion.key, NavigatorPanel_module_css_default.flash)) {
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
						if (hasMore && !loadingOlder) requestOlder();
						if (attempts < 200) {
							attempts += 1;
							retryTimer = window.setTimeout(attempt, 50);
						}
						return;
					}
					if (items.length === 0 && Date.now() - startedAt < 1e4 && attempts < 200) {
						attempts += 1;
						retryTimer = window.setTimeout(attempt, 50);
						return;
					}
					if (normalizedTargetText(jumpRequest.text) === "") {
						const fallback = items[items.length - 1];
						if (fallback !== void 0) jumpToQuestion(fallback.key, NavigatorPanel_module_css_default.flash);
					}
					completeNavigatorJump(jumpRequest.sequence);
				};
				attempt();
				return () => {
					cancelled = true;
					if (retryTimer !== null) window.clearTimeout(retryTimer);
				};
			}, [
				jumpRequest,
				openState,
				requestedQuestion,
				hasMore,
				loadingOlder,
				items,
				requestOlder
			]);
			const preview = (0, react.useMemo)(() => {
				if (hovered === null) return null;
				const index = deferredChat.order.indexOf(hovered);
				if (index < 0) return null;
				const node = indexed.nodes.get(hovered);
				if (node === void 0) return null;
				const question = questionNodeOf(node);
				if (question === null) return null;
				const text = questionText(question);
				const attachments = attachmentSummaries(question);
				const reply = replyAfter(indexed.nodes, deferredChat.order, index, question, running);
				return {
					key: hovered,
					text: text || (attachments.length > 0 ? t("item.attachmentOnly") : t("item.noText")),
					attachments,
					reply: reply.text,
					status: reply.status,
					time: question.data.time
				};
			}, [
				hovered,
				deferredChat,
				indexed,
				running,
				t
			]);
			const statusClass = (status) => {
				if (status === "completed") return NavigatorPanel_module_css_default.previewStatusCompleted ?? "";
				if (status === "interrupted") return NavigatorPanel_module_css_default.previewStatusInterrupted ?? "";
				if (status === "userStopped") return NavigatorPanel_module_css_default.previewStatusUserStopped ?? "";
				return NavigatorPanel_module_css_default.previewStatusRunning ?? "";
			};
			const statusLabel = (status) => {
				if (status === "completed") return t("preview.status.completed");
				if (status === "interrupted") return t("preview.status.interrupted");
				if (status === "userStopped") return t("preview.status.userStopped");
				return t("preview.status.running");
			};
			const onEnter = (0, react.useCallback)((key, event) => {
				cancelHide();
				const rect = event.currentTarget.getBoundingClientRect();
				setHovered(key);
				setHoverRect({
					left: rect.left,
					top: rect.top
				});
			}, [cancelHide]);
			const onJump = (0, react.useCallback)((key) => {
				jumpToQuestion(key, NavigatorPanel_module_css_default.flash);
			}, []);
			if (items.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: NavigatorPanel_module_css_default.root,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: NavigatorPanel_module_css_default.empty,
					children: t("empty.noMessages")
				})
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: NavigatorPanel_module_css_default.root,
				onMouseLeave: scheduleHide,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: NavigatorPanel_module_css_default.count,
						children: t("count", { total: items.length })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: NavigatorPanel_module_css_default.list,
						onScroll: onListScroll,
						children: items.map((item, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NavigatorQuestionRow, {
							item,
							index,
							t,
							onEnter,
							onLeave: scheduleHide,
							onJump
						}, item.key))
					}),
					canLoadEarlier && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: NavigatorPanel_module_css_default.loadOlderSlot,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: NavigatorPanel_module_css_default.loadOlder,
							disabled: loadingOlder,
							onClick: loadEarlier,
							children: loadingOlder ? t("board.loadingOlder") : t("board.loadOlder")
						})
					}),
					preview !== null && hoverRect !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: NavigatorPanel_module_css_default.preview,
						style: {
							left: Math.max(8, hoverRect.left - 296),
							top: hoverRect.top
						},
						role: "presentation",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: NavigatorPanel_module_css_default.previewQuestion,
								children: preview.text
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AttachmentBadges, {
								attachments: preview.attachments,
								t,
								preview: true
							}),
							preview.reply !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: NavigatorPanel_module_css_default.previewReply,
								children: preview.reply
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: NavigatorPanel_module_css_default.previewStatus + " " + statusClass(preview.status),
								children: statusLabel(preview.status)
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `chat.navigator` namespace dictionaries (zh is the key-set source of truth). */
		/** Simplified Chinese dictionary. */
		const zh = {
			"dock.open": "打开对话历史",
			"dock.close": "关闭对话历史",
			"dock.title": "对话历史",
			"history.title": "历史会话",
			"history.current": "当前",
			"history.open": "打开这个会话",
			"history.projectUnknown": "未标记项目",
			"history.attachmentQuestion": "（附件提问）",
			"history.resize": "调整历史会话与提问列表的高度",
			"count": "{total} 条提问",
			"board.current": "当前",
			"board.loadOlder": "加载更早提问",
			"board.loadingOlder": "正在加载…",
			"empty.noSession": "当前没有活跃会话。",
			"empty.noMessages": "还没有提问，发一条消息试试。",
			"item.attachmentOnly": "（附件提问）",
			"item.noText": "（无文字内容）",
			"attachment.image": "图片",
			"attachment.file": "文件",
			"preview.attachments": "附件",
			"preview.status.running": "正在回复…",
			"preview.status.completed": "本轮已结束",
			"preview.status.interrupted": "被迫中断",
			"preview.status.userStopped": "主动停止",
			"jump.hint": "点击跳转到该条消息"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"dock.open": "Open chat history",
			"dock.close": "Close chat history",
			"dock.title": "Chat history",
			"history.title": "Previous sessions",
			"history.current": "current",
			"history.open": "Open this session",
			"history.projectUnknown": "Unassigned project",
			"history.attachmentQuestion": "(attachment question)",
			"history.resize": "Resize the session and question panels",
			"count": "{total} questions",
			"board.current": "current",
			"board.loadOlder": "Load earlier questions",
			"board.loadingOlder": "Loading…",
			"empty.noSession": "No active session.",
			"empty.noMessages": "No questions yet — send a message to start.",
			"item.attachmentOnly": "(attachment-only question)",
			"item.noText": "(no text content)",
			"attachment.image": "image",
			"attachment.file": "file",
			"preview.attachments": "Attachments",
			"preview.status.running": "Replying…",
			"preview.status.completed": "Turn ended",
			"preview.status.interrupted": "Interrupted",
			"preview.status.userStopped": "Stopped by user",
			"jump.hint": "Click to jump to this message"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "chat.navigator";
		/** Required services: slots, locale, and native session navigation. */
		const inject = [
			"slots",
			"locale",
			"sessions"
		];
		/**
		* Client plugin body: register the `chat.navigator` dictionaries, the
		* floating dock into shell.overlay (declaring its session-scoped child seat),
		* and the panel into that seat. Both registrations wait on their slot
		* declarations via ctx.slots.inject, so activation order across plugins is
		* irrelevant.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const sessions = ctx.get("sessions");
			if (sessions === void 0) throw new Error("ui-chat-navigator: sessions service unavailable");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-chat-navigator: dictionaries");
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "chat-navigator",
				order: 0,
				locale: NS,
				children: { "chat.navigator.panel": {
					kind: "single",
					scope: "session"
				} },
				inject: () => ({
					openSession: (sessionId) => {
						sessions.open(sessionId);
					},
					openSessionAt: (sessionId, targetText) => {
						requestNavigatorJump(sessionId, targetText);
						sessions.open(sessionId);
					}
				})
			}, NavigatorDock));
			ctx.slots.inject("chat.navigator.panel", () => ctx.slots.register({
				name: "chat.navigator.panel",
				locale: NS,
				inject: (sessionId) => ({ loadOlder: () => sessions.binding(sessionId)?.session.loadOlder() ?? Promise.resolve() })
			}, NavigatorPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map