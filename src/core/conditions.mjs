// @ts-check

/**
 * Conditions — conditional output evaluator and bundled operators.
 *
 * Evaluates `data-condition` expressions on output elements, toggling
 * `is-active` based on whether the condition is met.
 *
 * Syntax: `for="id1 id2 refId" data-condition="id1:eq:refId or id2:gt:refId"`
 * - Each clause maps a watched ID to an operator and a reference ID.
 * - Clauses are joined by `and` / `or`.
 * - All IDs must appear in the `for` attribute for reactivity.
 * - No literals — all values come from the store via element IDs.
 *
 * Type coercion (default):
 * - If both values parse as finite numbers, compared numerically.
 * - Otherwise compared as strings.
 * - `data-type` on hidden inputs overrides: "number", "string", "boolean".
 *
 * Bundled operators: eq, neq, gt, gte, lt, lte.
 * Extended operators live in plugins/conditions.mjs.
 *
 * @module core/conditions
 */
//
// ── Conditions ─────────────────────────────────────────────────────────────
//
// Canonical source. Edit this file.
// global/conditions.js is generated from this file by build.sh — do not edit it.

import { store, registry, _conditions } from "./base.mjs"; // stripped in global build

// ── Type coercion ──────────────────────────────────────────────────────────

/**
 * Coerces two store values for comparison.
 * - If either value is a boolean, both are coerced to boolean.
 * - If both parse as finite numbers, both are coerced to number.
 * - Otherwise both are coerced to string.
 * @param {ExplorableValue} a
 * @param {ExplorableValue} b
 * @returns {[boolean, boolean] | [number, number] | [string, string]}
 */
function coerce(a, b) {
  // Boolean coercion — handles asymmetry between boolean constants
  // (from data-type="boolean" hidden inputs) and string values
  // (from select and text inputs which always yield strings).
  if (typeof a === "boolean" || typeof b === "boolean") {
    return [String(a) === "true", String(b) === "true"];
  }
  // Numeric coercion
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return [na, nb];
  // String fallback
  return [String(a), String(b)];
}

// ── Condition parser ───────────────────────────────────────────────────────

/**
 * Parses a single condition clause: "leftId:operator:rightId"
 * @param {string} clause
 * @returns {{ leftId: string, operator: string, rightId: string } | null}
 */
function parseClause(clause) {
  const parts = clause.trim().split(":");
  if (parts.length !== 3) return null;
  const [leftId, operator, rightId] = parts;
  return { leftId, operator, rightId };
}

/**
 * Parses a full `data-condition` expression into an array of clauses
 * and the boolean operator joining them.
 * "id1:eq:ref or id2:gt:ref" → { join: "or", clauses: [...] }
 * @param {string} expr
 * @returns {{ join: "and" | "or", clauses: Array<{ leftId: string, operator: string, rightId: string }> }}
 */
function parseCondition(expr) {
  const join = expr.includes(" or ") ? "or" : "and";
  const separator = join === "or" ? " or " : " and ";
  const clauses = expr.split(separator)
    .map(parseClause)
    .filter(/** @param {any} c */ c => c !== null);
  return { join, clauses };
}

// ── Evaluator ──────────────────────────────────────────────────────────────

/**
 * Evaluates a single clause against the current store values.
 * @param {{ leftId: string, operator: string, rightId: string }} clause
 * @returns {boolean}
 */
function evaluateClause(clause) {
  const left  = store.get(clause.leftId);
  const right = store.get(clause.rightId);
  const evaluate = _conditions[clause.operator];
  if (!evaluate) return false;
  const [a, b] = coerce(left, right);
  return evaluate(a, b);
}

/**
 * Evaluates a full condition expression against the current store.
 * @param {string} expr
 * @returns {boolean}
 */
function evaluateCondition(expr) {
  const { join, clauses } = parseCondition(expr);
  if (!clauses.length) return false;
  return join === "or"
    ? clauses.some(evaluateClause)
    : clauses.every(evaluateClause);
}

// ── Bundled operators ──────────────────────────────────────────────────────

/**
 * Registers the bundled condition operators.
 * @returns {void}
 */
function registerBundledConditions() {
  registry.registerCondition({ operator: "eq",  evaluate: (a, b) => a === b });
  registry.registerCondition({ operator: "neq", evaluate: (a, b) => a !== b });
  registry.registerCondition({ operator: "gt",  evaluate: (a, b) => a > b   });
  registry.registerCondition({ operator: "gte", evaluate: (a, b) => a >= b  });
  registry.registerCondition({ operator: "lt",  evaluate: (a, b) => a < b   });
  registry.registerCondition({ operator: "lte", evaluate: (a, b) => a <= b  });
}

// ── Wiring ─────────────────────────────────────────────────────────────────

/**
 * Wires up all `[data-condition]` outputs within `[data-explorable]`
 * containers. Subscribes to all IDs in `for` and toggles `is-active`
 * whenever any dependency changes.
 * @returns {void}
 */
/**
 * Wires up all `[data-condition]` outputs within `[data-explorable]`
 * containers. Subscribes to all IDs in `for` and toggles `is-active`
 * whenever any dependency changes.
 *
 * Called internally by initEngine after all plugins have registered
 * their operators. Not exported — internal to the engine.
 * @returns {void}
 */
function wireConditions() {
  document.querySelectorAll("[data-explorable] output[data-condition]").forEach(output => {
    const el = /** @type {HTMLOutputElement} */ (output);
    const expr = el.dataset.condition ?? "";
    const dependencies = [...el.htmlFor];
    if (!expr || !dependencies.length) return;

    const update = () => {
      el.classList.toggle("is-active", evaluateCondition(expr));
    };

    update();
    dependencies.forEach(id => store.subscribe(id, update));
  });
}

export { registerBundledConditions, wireConditions };
