# explorable

Explorable is a small JavaScript library for documents that invite exploration
rather than just reception — turning prose into a space where the reader can
adjust assumptions, pose alternatives, and watch conclusions follow in real time.

The idea originates with Bret Victor's [Explorable Explanations](https://worrydream.com/ExplorableExplanations/).

---

## What it does

Inputs, outputs, and the relationships between them are declared directly in the
HTML. The library reads those declarations and keeps everything current —
updating values, formatting them, showing and hiding content as conditions change.

The document remains readable as a plain page if the library never loads.
JavaScript makes it live; it does not make it exist.

---

## Getting started

No build step. No dependencies. Add a script tag and mark a container.

**ESM:**

```html
<script type="module" src="explorable/src/main.mjs"></script>
```

**Global (plain script tags):**

```html
<script src="explorable/global/core/base.js" defer></script>
<script src="explorable/global/core/conditions.js" defer></script>
<script src="explorable/global/core/engine.js" defer></script>
<script src="explorable/global/interaction.js" defer></script>
<script src="explorable/global/plugins/conditions.js" defer></script>
<script src="explorable/global/plugins/formatters.js" defer></script>
<script src="explorable/global/plugins/helpers.js" defer></script>
<script src="explorable/global/plugins/visuals.js" defer></script>
<script src="explorable/global/main.js" defer></script>
```

Mark the region of the document that should be explorable:

```html
<main data-explorable>
  <!-- inputs, outputs, and prose live here -->
</main>
```

A minimal example — a number input whose value is reflected live in an output:

```html
<div lang="en-CA" data-explorable>
  <input type="hidden" id="goal" value="200" />
  <output id="total" for="weekly weeks" data-helper="multiply" hidden></output>

  <p>
    Weekly saving:
    <label for="weekly">$7</label
    ><input type="number" id="weekly" value="7" data-format="currency:USD" />
    × <label for="weeks">26</label><input type="number" id="weeks" value="26" /> weeks =
    <output for="total" id="c-total-alias" data-helper="alias" data-format="currency:USD">$182</output>
  </p>

  <output for="total goal" data-condition="total:gte:goal">
    Goal of reached. You saved enough to make it happen.
  </output>
  <output for="total goal" data-condition="total:lt:goal">
    Not there yet. Keep going.
  </output>
</div>
```

---

## How it works

Inputs write into a central store. Outputs declare which inputs they depend on
via the HTML `for` attribute and name a helper that computes their value. The
engine evaluates outputs in dependency order and keeps them current as inputs
change. Formatters control how values are displayed; conditions control whether
outputs are visible at all.

Everything outside `[data-explorable]` is untouched.

---

## Structure

```text
src/
  core/
    base.mjs          — store and plugin registry
    engine.mjs        — reactive evaluation
    conditions.mjs    — conditional output visibility
  plugins/
    formatters.mjs    — currency, number, percentage, date
    helpers.mjs       — slugify and others
    visuals.mjs       — color swatch
    conditions.mjs    — contains, startsWith, endsWith
  interaction.mjs     — label/input interaction layer
  main.mjs            — entry point (ESM)
```

The `global/` directory contains the same files compiled for use without a
module bundler.
