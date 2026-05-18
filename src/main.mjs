// @ts-check

/**
 * ESM entry point.
 *
 * Imports and initialises the engine, interaction layer, and all plugins.
 * Plugins must be initialised before initEngine so their registrations
 * are in place when the engine starts.
 *
 * To add a plugin: import it here and call its init before initEngine.
 * Core is never touched.
 *
 * @module main
 */
//
// ── Entry point (ESM) ──────────────────────────────────────────────────────
//
// Single script tag in HTML:
//   <script type="module" src="explorable/main.mjs"></script>

import { initEngine } from "./core.mjs";
import { initInteraction } from "./interaction.mjs";
import { initConditions } from "./plugins/conditions.mjs";
import { initFormatters, initStaticFormatting } from "./plugins/formatters.mjs";
import { initVisuals } from "./plugins/visuals.mjs";
import { initHelpers } from "./plugins/helpers.mjs";

initConditions();
initFormatters();
initVisuals();
initHelpers();

initEngine();
initInteraction();

initStaticFormatting();
