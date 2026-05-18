// @ts-check

/**
 * Explorable core — public API.
 *
 * Re-exports the public surface of the core subsystem:
 * - store and registry from core/base
 * - initEngine and initState from core/engine
 * - initInteraction from interaction
 *
 * Import from this file for convenience. For finer-grained imports
 * in ESM contexts, import directly from core/base.mjs or core/engine.mjs.
 *
 * @module core
 */
//
// ── Core (public face) ─────────────────────────────────────────────────────
//
// Thin re-export module. All logic lives in core/ and interaction.mjs.

export { store, registry } from "./core/base.mjs";
export { initEngine, initState } from "./core/engine.mjs";
export { initInteraction } from "./interaction.mjs";
