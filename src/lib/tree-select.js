/**
 * src/lib/tree-select.js
 *
 * Interactive tree-based multi-select widget for terminal.
 * Uses raw mode for arrow key navigation, space to toggle, enter to confirm.
 */

/**
 * @typedef {Object} TreeItem
 * @property {string} key     - Unique identifier
 * @property {string} label   - Display label (e.g. "nextjs (Next.js)")
 * @property {string} prefix  - Tree-drawing prefix (e.g. "├── ")
 */

/**
 * Build a flattened tree item list from presets for display.
 *
 * @param {{ key: string, parent: string|null, label: string }[]} presets
 * @returns {TreeItem[]}
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

  // Find roots (no parent or parent not in presets)
  const roots = presets
    .filter((p) => !p.parent || !presetMap.has(p.parent))
    .map((p) => p.key);

  const items = [];

  function walk(key, ownPrefix, childPrefix) {
    const p = presetMap.get(key);
    items.push({ key, label: `${key} (${p.label})`, prefix: ownPrefix });

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

/**
 * Display an interactive tree with multi-select.
 * Pauses the readline interface during interaction.
 *
 * @param {import("readline").Interface} rl - Existing readline interface
 * @param {TreeItem[]} items - Flattened tree items in display order
 * @param {Object} [opts]
 * @param {string} [opts.hint] - Hint text shown below the tree
 * @returns {Promise<string[]>} Selected keys (in display order)
 */
export function treeSelect(rl, items, opts = {}) {
  if (!process.stdin.isTTY) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const hint = opts.hint || "↑↓: move  space: select  enter: confirm";
    const selected = new Set();
    let cursor = 0;
    const output = process.stdout;
    const input = process.stdin;

    rl.pause();
    input.setRawMode(true);
    input.resume();

    let rendered = false;

    function render() {
      if (rendered) {
        output.write(`\x1B[${items.length + 1}A`);
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const check = selected.has(item.key) ? "[x]" : "[ ]";
        const arrow = i === cursor ? "> " : "  ";
        const line = `${arrow}${item.prefix}${check} ${item.label}`;

        if (i === cursor) {
          output.write(`\x1B[2K\x1B[36m${line}\x1B[0m\n`);
        } else {
          output.write(`\x1B[2K${line}\n`);
        }
      }
      output.write(`\x1B[2K  ${hint}`);
      rendered = true;
    }

    render();

    function cleanup() {
      input.removeListener("data", onData);
      input.setRawMode(false);
      rl.resume();
      output.write("\n");
    }

    function onData(buf) {
      const key = buf.toString();

      if (key === "\x1B[A") {
        if (cursor > 0) cursor--;
        render();
      } else if (key === "\x1B[B") {
        if (cursor < items.length - 1) cursor++;
        render();
      } else if (key === " ") {
        const item = items[cursor];
        if (selected.has(item.key)) {
          selected.delete(item.key);
        } else {
          selected.add(item.key);
        }
        render();
      } else if (key === "\r" || key === "\n") {
        cleanup();
        // Return in display order
        const result = items.filter((it) => selected.has(it.key)).map((it) => it.key);
        resolve(result);
      } else if (key === "\x03") {
        cleanup();
        process.exit(0);
      }
    }

    input.on("data", onData);
  });
}
