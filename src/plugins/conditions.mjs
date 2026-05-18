// @ts-check

/**
 * Conditions plugin — extended string condition operators.
 *
 * Registers additional condition operators for use in `data-condition`
 * expressions. These complement the bundled operators (eq, neq, gt, gte,
 * lt, lte) with string-specific comparisons.
 *
 * Operators registered here:
 *   contains   — left contains right as a substring (case-insensitive)
 *   startsWith — left starts with right (case-insensitive)
 *   endsWith   — left ends with right (case-insensitive)
 *
 * All comparisons are case-insensitive by default. Both values are
 * coerced to strings before comparison.
 *
 * Example:
 *   <input type="hidden" id="keyword" value="apple" data-type="string" />
 *   <input type="text" id="search" value="" />
 *   <output for="search keyword" data-condition="search:contains:keyword">
 *     Found a match.
 *   </output>
 *
 * @module plugins/conditions
 */
//
// ── Conditions plugin ──────────────────────────────────────────────────────
//
// Canonical source. Edit this file.
// global/conditions-plugin.js is generated from this file by build.sh
// — do not edit it.

import { registry } from "../core/base.mjs"; // stripped in global build; registry is a global there

/**
 * Initialises the conditions plugin by registering string operators.
 * @returns {void}
 */
function initConditions() {

  // Case-insensitive string contains
  registry.registerCondition({
    operator: "contains",
    evaluate: (a, b) =>
      String(a).toLowerCase().includes(String(b).toLowerCase()),
  });

  // Case-insensitive string startsWith
  registry.registerCondition({
    operator: "startsWith",
    evaluate: (a, b) =>
      String(a).toLowerCase().startsWith(String(b).toLowerCase()),
  });

  // Case-insensitive string endsWith
  registry.registerCondition({
    operator: "endsWith",
    evaluate: (a, b) =>
      String(a).toLowerCase().endsWith(String(b).toLowerCase()),
  });

}

export { initConditions };
