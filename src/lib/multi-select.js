/**
 * src/lib/multi-select.js
 *
 * Interactive select widget for terminal.
 * Supports single-select and multi-select modes with arrow key navigation.
 */

/**
 * @typedef {Object} SelectItem
 * @property {string} key       - Unique identifier
 * @property {string} label     - Display label
 * @property {string} [prefix]  - Optional display prefix (e.g. tree-drawing chars)
 * @property {string} [parent]  - Parent key (for autoSelectAncestors)
 */

/**
 * Build a flattened tree item list from presets for display.
 * Each item includes a parent field for ancestor auto-selection.
 *
 * @param {{ key: string, parent: string|null, label: string }[]} presets
 * @returns {SelectItem[]}
 */
export function buildTreeItems(presets) {
  const childrenMap = new Map();
  const presetMap = new Map();

  for (const p of presets) {
    presetMap.set(p.key, p);
    if (!childrenMap.has(p.key)) childrenMap.set(p.key, []);
    const parentKey = p.parent || null;
    if (parentKey) {
      if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
      childrenMap.get(parentKey).push(p.key);
    }
  }

  const roots = presets
    .filter((p) => !p.parent || !presetMap.has(p.parent))
    .map((p) => p.key);

  const items = [];

  function walk(key, ownPrefix, childPrefix) {
    const p = presetMap.get(key);
    items.push({
      key,
      label: `${key} (${p.label})`,
      prefix: ownPrefix,
      parent: p.parent || null,
    });

    const kids = childrenMap.get(key) || [];
    for (let i = 0; i < kids.length; i++) {
      const isLast = i === kids.length - 1;
      walk(
        kids[i],
        childPrefix + (isLast ? "└── " : "├── "),
        childPrefix + (isLast ? "    " : "│   "),
      );
    }
  }

  for (const root of roots) {
    walk(root, "", "");
  }

  return items;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderLine(output, item, cursor, index, mode, selected) {
  const pfx = item.prefix || "";
  let line;

  if (mode === "single") {
    const marker = index === cursor ? ">" : " ";
    line = ` ${marker} ${pfx}${item.label}`;
  } else {
    const check = selected.has(item.key) ? "[x]" : "[ ]";
    const marker = index === cursor ? ">" : " ";
    line = ` ${marker} ${pfx}${check} ${item.label}`;
  }

  if (index === cursor) {
    output.write(`\r\x1B[2K\x1B[36m${line}\x1B[0m\n`);
  } else {
    output.write(`\r\x1B[2K${line}\n`);
  }
}

// ---------------------------------------------------------------------------
// Core select
// ---------------------------------------------------------------------------

const HINT_SINGLE = "↑↓: move  enter: confirm";
const HINT_MULTI = "↑↓: move  space: select  enter: confirm";

/**
 * Interactive select widget.
 * Pauses the readline interface during interaction.
 *
 * @param {import("readline").Interface} rl - Existing readline interface
 * @param {SelectItem[]} items - Items in display order
 * @param {Object} [opts]
 * @param {"single"|"multi"} [opts.mode="multi"]
 * @param {boolean} [opts.autoSelectAncestors=false] - Auto-select parent items (multi only)
 * @param {string|string[]} [opts.default] - Default key(s). Single: initial cursor position. Multi: pre-selected keys.
 * @param {string} [opts.hint] - Custom hint text
 * @returns {Promise<string|string[]>} single → key string, multi → key array
 */
export function select(rl, items, opts = {}) {
  const mode = opts.mode || "multi";

  if (!process.stdin.isTTY) {
    return Promise.resolve(mode === "single" ? items[0]?.key : []);
  }

  return new Promise((resolve) => {
    const hint = opts.hint || (mode === "single" ? HINT_SINGLE : HINT_MULTI);
    const selected = new Set();
    let cursor = 0;

    // Apply defaults
    if (opts.default) {
      const defaults = Array.isArray(opts.default) ? opts.default : [opts.default];
      if (mode === "single") {
        const idx = items.findIndex((it) => it.key === defaults[0]);
        if (idx >= 0) cursor = idx;
      } else {
        for (const d of defaults) {
          if (items.some((it) => it.key === d)) selected.add(d);
        }
      }
    }
    const output = process.stdout;
    const input = process.stdin;

    // Fully detach readline from stdin so raw mode key events reach us directly.
    // rl.pause() alone is insufficient — readline still intercepts keypress events
    // and echoes characters to the terminal.
    const savedListeners = input.rawListeners("keypress");
    input.removeAllListeners("keypress");
    rl.pause();
    input.setRawMode(true);
    input.resume();

    let rendered = false;

    // Blank line between label and list (outside render region)
    output.write("\n");

    function render() {
      if (rendered) {
        output.write(`\x1B[${items.length}A`);
      }
      for (let i = 0; i < items.length; i++) {
        renderLine(output, items[i], cursor, i, mode, selected);
      }
      output.write(`\r\x1B[2K  ${hint}`);
      rendered = true;
    }

    function selectAncestors(key) {
      const item = items.find((it) => it.key === key);
      if (item?.parent) {
        selected.add(item.parent);
        selectAncestors(item.parent);
      }
    }

    render();

    function cleanup() {
      input.removeListener("data", onData);
      input.setRawMode(false);
      for (const listener of savedListeners) {
        input.on("keypress", listener);
      }
      rl.resume();
      output.write("\n");
    }

    function onData(buf) {
      const seq = buf.toString();

      if (seq === "\x1B[A") {
        if (cursor > 0) cursor--;
        render();
      } else if (seq === "\x1B[B") {
        if (cursor < items.length - 1) cursor++;
        render();
      } else if (seq === " " && mode === "multi") {
        const item = items[cursor];
        if (selected.has(item.key)) {
          selected.delete(item.key);
        } else {
          selected.add(item.key);
          if (opts.autoSelectAncestors) selectAncestors(item.key);
        }
        render();
      } else if (seq === "\r" || seq === "\n") {
        if (mode === "multi" && selected.size === 0) return;
        cleanup();
        if (mode === "single") {
          resolve(items[cursor].key);
        } else {
          resolve(items.filter((it) => selected.has(it.key)).map((it) => it.key));
        }
      } else if (seq === "\x03") {
        cleanup();
        process.exit(0);
      } else {
        // Ignore unknown keys but redraw hint to prevent visual corruption
        output.write(`\r\x1B[2K  ${hint}`);
      }
    }

    input.on("data", onData);
  });
}
