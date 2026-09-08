//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `dsh-chat-navigator`.
* @module dsh-chat-navigator/invariant
*/
const PACKAGE_NAME = "dsh-chat-navigator";
/** Cordis companion plugin name. */
const name = "client-ui-chat-navigator-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the dock and panel are slot registrations owned and
* observed by the slot registry; the derived rows come straight from the
* framework standard hooks.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
