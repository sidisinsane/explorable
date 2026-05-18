// ── File input utility (global) ────────────────────────────────────────────
//
// Handwritten. Not generated. Not part of the ESM build.
//
// Wires up two optional elements by ID:
//
//   #state-file   <input type="file"> — loads a JSON file into the store.
//   #state-reset  <button>           — restores all inputs to their HTML
//                                      default values.
//
// Neither element is required. If absent the document loads and behaves
// normally with HTML default values. If present both are fully functional
// without any further wiring in the entry point.
//
// The change listener is never detached. After each load the file input
// is reset so the same file can be picked again.

(function () {

  // ── File input ─────────────────────────────────────────────────────────

  const fileInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById("state-file")
  );

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.addEventListener("load", function () {
        try {
          const state = JSON.parse(/** @type {string} */ (reader.result));
          initState(Promise.resolve(state));
        } catch {
          console.warn("state-file: failed to parse JSON, using defaults.");
        } finally {
          fileInput.value = "";
        }
      });

      reader.addEventListener("error", function () {
        console.warn("state-file: failed to read file.");
        fileInput.value = "";
      });

      reader.readAsText(file);
    });
  }

  // ── Reset button ───────────────────────────────────────────────────────

  const resetButton = document.getElementById("state-reset");

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      document.querySelectorAll("input[id]").forEach(function (el) {
        const input = /** @type {HTMLInputElement} */ (el);
        input.value = input.defaultValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      if (fileInput) fileInput.value = "";
    });
  }

}());
