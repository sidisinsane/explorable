// @ts-check

/**
 * Engine — reactive evaluation, dependency graph, and bundled helpers.
 *
 * Consumes the store and registry from base. Evaluates `data-helper`
 * expressions on output elements by looking up named helper functions
 * and passing dependency values as an array.
 *
 * Bundled helpers (alias, add, subtract, multiply, divide) are registered
 * at initEngine time — no separate plugin needed for basic arithmetic.
 *
 * @module core/engine
 */
//
// ── Engine ─────────────────────────────────────────────────────────────────
//
// Canonical source. Edit this file.
// global/engine.js is generated from this file by build.sh — do not edit it.

import { store, registry, _helpers, getFormatter, getParentLang } from "./base.mjs";
import { registerBundledConditions, wireConditions } from "./conditions.mjs";

// ── Dependency graph + topological sort ───────────────────────────────────
//
// Ensures outputs that depend on other outputs are always evaluated after
// their dependencies, regardless of DOM order.

/**
 * Builds a map of each output element to the set of other output IDs
 * it directly depends on.
 * @param {NodeListOf<HTMLOutputElement>} outputs
 * @returns {Map<HTMLOutputElement, Set<string>>}
 */
function buildDeps(outputs) {
  const outputIds = new Set([...outputs].map(el => el.id).filter(Boolean));
  /** @type {Map<HTMLOutputElement, Set<string>>} */
  const deps = new Map();
  for (const el of outputs) {
    deps.set(el, new Set([...el.htmlFor].filter(id => outputIds.has(id))));
  }
  return deps;
}

/**
 * Returns `outputs` sorted so that each element appears after all of its
 * output dependencies.
 * @param {HTMLOutputElement[]} outputs
 * @param {Map<HTMLOutputElement, Set<string>>} deps
 * @returns {HTMLOutputElement[]}
 */
function topoSort(outputs, deps) {
  /** @type {HTMLOutputElement[]} */
  const sorted = [];
  /** @type {Set<HTMLOutputElement>} */
  const visited = new Set();

  /** @param {HTMLOutputElement} el */
  function visit(el) {
    if (visited.has(el)) return;
    visited.add(el);
    for (const depId of deps.get(el) ?? []) {
      const depEl = outputs.find(o => o.id === depId);
      if (depEl) visit(depEl);
    }
    sorted.push(el);
  }

  outputs.forEach(visit);
  return sorted;
}

// ── Reactive engine ────────────────────────────────────────────────────────

/**
 * Wires up a single `<output data-helper>` element: looks up the named
 * helper, subscribes to its dependencies, and runs an initial evaluation.
 *
 * The helper receives dependency values as an array and the output's
 * dataset as a second argument — allowing element-level configuration
 * (e.g. data-separator) without the engine needing to know about it.
 *
 * @param {HTMLOutputElement} output
 * @returns {void}
 */
function initOutput(output) {
  const helperName = output.dataset.helper;
  const dependencies = [...output.htmlFor];
  if (!helperName || !dependencies.length) return;

  const update = () => {
    const helper = _helpers[helperName];
    if (!helper) return;

    try {
      const args = dependencies.map(id => store.get(id));
      const result = helper(args, output.dataset);
      const value = (typeof result === "number" && !Number.isFinite(result))
        ? 0
        : result;
      store._set(output.id, value);
      output.value = String(value);
      output.dispatchEvent(new CustomEvent("explorable:update", { bubbles: false }));
    } catch {
      output.value = "!";
    }
  };

  dependencies.forEach(id => store.subscribe(id, update));
  update();
}

/**
 * Seeds the store with initial values for all inputs within
 * `[data-explorable]` containers and keeps the store in sync.
 * Includes hidden inputs — these act as constants in the document.
 * @returns {void}
 */
function seedInputs() {
  document.querySelectorAll("[data-explorable] input").forEach(input => {
    const el = /** @type {HTMLInputElement} */ (input);
    if (!el.id) return;

    const readValue = () => {
      // Hidden inputs: respect explicit data-type, otherwise coerce if numeric
      if (el.type === "hidden") {
        if (el.dataset.type === "boolean") return el.value === "true";
        if (el.dataset.type === "string")  return el.value;
        if (el.dataset.type === "number")  return Number(el.value);
        const n = Number(el.value);
        return Number.isFinite(n) ? n : el.value;
      }
      if (el.type !== "text" && el.type !== "date" && el.type !== "color") {
        const n = el.valueAsNumber;
        return Number.isFinite(n) ? n : el.value;
      }
      return el.value;
    };

    store._set(el.id, readValue());
    el.addEventListener("input", () => store._set(el.id, readValue()));
  });

  document.querySelectorAll("[data-explorable] select").forEach(select => {
    const el = /** @type {HTMLSelectElement} */ (select);
    if (!el.id) return;
    store._set(el.id, el.value);
    el.addEventListener("input", () => store._set(el.id, el.value));
  });
}

// ── Output formatting ──────────────────────────────────────────────────────

/**
 * Wires up formatted text content for a single output element.
 * Updates on every explorable:update event.
 * @param {HTMLOutputElement} output
 * @returns {void}
 */
function initFormattedOutput(output) {
  const match = getFormatter(output);
  if (!match) return;

  if (!output.id) {
    console.warn("explorable: formatted output is missing an id — store key collision possible", output);
  }

  const { formatter, value: fmtValue } = match;

  const format = () => {
    output.textContent = formatter.format(
      store.get(output.id),
      fmtValue,
      getParentLang(output)
    );
  };

  format();
  output.addEventListener("explorable:update", format);
}

// ── Output highlight ───────────────────────────────────────────────────────

/**
 * Wires up the `is-updated` class on a single output element.
 * The class is removed when its CSS animation ends — opt-in via CSS.
 * @param {HTMLOutputElement} output
 * @returns {void}
 */
function initOutputHighlight(output) {
  output.addEventListener("explorable:update", () => {
    output.classList.remove("is-updated");
    void output.offsetWidth;
    output.classList.add("is-updated");
  });

  output.addEventListener("animationend", () => {
    output.classList.remove("is-updated");
  });
}

// ── Conditional outputs ────────────────────────────────────────────────────
// Handled by core/conditions.mjs — initConditions is called from initEngine.

// ── Revealing ─────────────────────────────────────────────────────────────

/**
 * Briefly adds `is-revealing` to the document body on load.
 * CSS decides what affordances to reveal during this window.
 * @param {number} [duration=2000]
 * @returns {void}
 */
function initRevealing(duration = 2000) {
  document.body.classList.add("is-revealing");
  setTimeout(() => document.body.classList.remove("is-revealing"), duration);
}

// ── Bundled helpers ────────────────────────────────────────────────────────
//
// Registered at initEngine time. These cover the common arithmetic cases
// and the identity function. Additional helpers live in plugins/helpers.mjs.

/**
 * Registers the bundled helpers with the core registry.
 * @returns {void}
 */
function registerBundledHelpers() {
  registry.registerHelper("alias",    (args) => args[0]);
  registry.registerHelper("add",      (args) => args.reduce((t, n) => Number(t) + Number(n), 0));
  registry.registerHelper("subtract", (args) => args.reduce((a, b) => Number(a) - Number(b)));
  registry.registerHelper("multiply", (args) => args.reduce((t, c) => Number(t) * Number(c), 1));
  registry.registerHelper("divide",   (args) => args.reduce((a, c) => Number(a) / Number(c)));
}

// ── State loading ──────────────────────────────────────────────────────────

/**
 * Seeds the store and syncs DOM inputs from an external state object.
 * Agnostic about the data source — the caller decides whether that is
 * a static JSON file, a REST endpoint, a WebSocket, or anything else.
 *
 * Call this before `initEngine` so the seeded values are in place when
 * the engine runs its initial evaluation.
 *
 * @param {Promise<Record<string, ExplorableValue>>} source
 * @returns {Promise<void>}
 */
async function initState(source) {
  const state = await source;

  for (const [id, value] of Object.entries(state)) {
    if (value === null || value === undefined) continue;

    const input = /** @type {HTMLInputElement|null} */ (document.getElementById(id));
    if (!input) continue;

    input.value = String(value);
    store._set(id, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// ── Public init ────────────────────────────────────────────────────────────

/**
 * Initialises the reactive engine: registers bundled helpers, seeds inputs,
 * builds the dependency graph, sorts outputs topologically, wires up outputs.
 * Call this once after the DOM is ready and all plugins have registered.
 * @returns {void}
 */
function initEngine() {
  registerBundledHelpers();
  seedInputs();

  const outputs = /** @type {NodeListOf<HTMLOutputElement>} */ (
    document.querySelectorAll("[data-explorable] output[data-helper]")
  );
  const deps = buildDeps(outputs);
  const sorted = topoSort([...outputs], deps);
  sorted.forEach(initOutput);

  sorted.forEach(output => {
    initFormattedOutput(output);
    initOutputHighlight(output);
  });

  registerBundledConditions();
  wireConditions();
  initRevealing();
}

export { store, registry, initEngine, initState };
