// ── Shared types ───────────────────────────────────────────────────────────
//
// Pure JSDoc type declarations for the Explorable library.
// No logic. No imports. No exports.
//
// Picked up automatically by the type checker via jsconfig.json.
// Invisible to the runtime.

/**
 * A value stored in the explorable value store, keyed by element ID.
 * May be a number, string, or any other value a helper returns.
 * @typedef {number | string | boolean} ExplorableValue
 */

/**
 * Called whenever the value for a subscribed ID changes.
 * @callback SubscribeCallback
 * @param {ExplorableValue} value - The new value.
 * @returns {void}
 */

/**
 * Unsubscribes a previously registered callback.
 * @callback Unsubscribe
 * @returns {void}
 */

/**
 * The public interface of the explorable value store.
 * Plugins may call `get` and `subscribe`.
 * Only the core engine calls `_set`.
 *
 * @typedef {object} Store
 * @property {function(string): ExplorableValue} get
 *   Returns the current value for the given element ID, or 0 if not set.
 * @property {function(string, SubscribeCallback): Unsubscribe} subscribe
 *   Registers a callback for value changes on the given ID.
 *   Returns an unsubscribe function.
 * @property {function(string, ExplorableValue): void} _set
 *   Internal. Sets a value and notifies subscribers.
 *   Not intended for use by plugins.
 */

/**
 * A formatter registered with the core engine.
 * Matched by the type string in `data-format="type:value"`.
 *
 * @typedef {object} Formatter
 * @property {string} type
 *   The format type string that opts an element into this formatter.
 *   Matched against the part before the colon in `data-format`.
 * @property {function(ExplorableValue, string, string): string} format
 *   Formats a value for display. Arguments: value, configValue, lang.
 *   configValue is the part after the colon in `data-format` (e.g. "USD").
 */

/**
 * An input handler registered with the core engine.
 * Describes how to wire up a specific input type.
 *
 * `present` and `attach` are deliberately separate:
 * - `present` always runs — sets up initial visual state (hide input, set label text)
 * - `attach` only runs when the input is not frozen — wires up interaction
 *
 * @typedef {object} InputHandler
 * @property {function(HTMLInputElement): boolean} match
 *   Returns true if this handler should manage the given input.
 * @property {function(HTMLLabelElement, HTMLInputElement): void} present
 *   Sets up initial visual state. Always called, frozen or not.
 * @property {function(HTMLLabelElement, HTMLInputElement): void} attach
 *   Wires up interaction behaviour. Only called when the input is not frozen.
 */

/**
 * A visual registered with the core engine.
 * Renders a visual representation onto the label associated with an input.
 * Unlike formatters, visuals receive the label element directly and may
 * set CSS custom properties, add classes, or manipulate the DOM freely.
 * Called on init and on every store update for the input's ID.
 *
 * @typedef {object} Visual
 * @property {string} attribute
 *   The data attribute on the input that opts it into this visual.
 * @property {function(HTMLLabelElement, ExplorableValue, string): void} render
 *   Renders the visual onto the label. Arguments: label, value, attrValue.
 */

/**
 * A condition operator registered with the core engine.
 * Compares two coerced store values and returns a boolean.
 *
 * Values are coerced before comparison:
 * - If both parse as finite numbers, compared numerically.
 * - Otherwise compared as strings.
 * - `data-type` on hidden inputs overrides coercion explicitly.
 *
 * @typedef {object} Condition
 * @property {string} operator
 *   The operator name used in `data-condition` expressions (e.g. "eq", "gt").
 * @property {function(ExplorableValue, ExplorableValue): boolean} evaluate
 *   Evaluates the condition. Arguments: left (watched value), right (reference value).
 */

/**
 * The public plugin registration API exposed by the core.
 * Plugins call these to extend the engine without touching core.
 *
 * @typedef {object} Registry
 * @property {function(string, function(Array<ExplorableValue>, DOMStringMap): ExplorableValue): void} registerHelper
 *   Registers a helper function by name.
 *   Receives dependency values as an array and the output's dataset.
 * @property {function(Formatter): void} registerFormatter
 *   Registers a value formatter tied to a format type string.
 * @property {function(InputHandler): void} registerInputHandler
 *   Registers an input interaction handler.
 * @property {function(Visual): void} registerVisual
 *   Registers a visual renderer tied to a data attribute on an input.
 * @property {function(Condition): void} registerCondition
 *   Registers a condition operator for use in `data-condition` expressions.
 */
