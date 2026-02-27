/**
 * tools/engine/renderers.js
 *
 * ディレクティブの renderer 名に対応するマークダウン生成関数。
 * すべて (data, labels) => string を返す。
 */

/**
 * table: 配列 → ヘッダー付きマークダウンテーブル
 *
 * @param {Object[]} data  - 行データの配列。各オブジェクトのフィールド順が labels に対応
 * @param {string[]} labels - テーブルヘッダー表示名
 * @returns {string}
 */
export function table(data, labels) {
  if (!Array.isArray(data) || data.length === 0) {
    return emptyTable(labels);
  }

  const keys = Object.keys(data[0]);
  const header = `| ${labels.join(" | ")} |`;
  const sep = `| ${labels.map(() => "---").join(" | ")} |`;
  const rows = data.map((row) => {
    const cells = keys.map((k) => {
      const v = row[k];
      if (v === undefined || v === null) return "—";
      if (Array.isArray(v)) return v.join(", ");
      return String(v);
    });
    return `| ${cells.join(" | ")} |`;
  });

  return [header, sep, ...rows].join("\n");
}

/**
 * kv: オブジェクト → 2 列テーブル (キー | 値)
 *
 * @param {Object[]|Object} data - [{key, value}] または {key: value}
 * @param {string[]} labels - 2 つのヘッダー表示名
 * @returns {string}
 */
export function kv(data, labels) {
  const header = `| ${labels.join(" | ")} |`;
  const sep = `| ${labels.map(() => "---").join(" | ")} |`;

  let rows;
  if (Array.isArray(data)) {
    rows = data.map((item) => {
      const k = item.key ?? item.name ?? Object.values(item)[0];
      const v = item.value ?? item.description ?? Object.values(item)[1];
      return `| ${k} | ${v ?? "—"} |`;
    });
  } else if (typeof data === "object" && data !== null) {
    rows = Object.entries(data).map(([k, v]) => {
      const val = v === undefined || v === null ? "—" : String(v);
      return `| ${k} | ${val} |`;
    });
  } else {
    return emptyTable(labels);
  }

  if (rows.length === 0) return emptyTable(labels);
  return [header, sep, ...rows].join("\n");
}

/**
 * mermaid-er: リレーション → ER 図コードブロック (labels 不要)
 *
 * @param {Object[]} data - [{parent, child, type}]
 * @returns {string}
 */
export function mermaidEr(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return "```mermaid\nerDiagram\n```";
  }

  const lines = ["```mermaid", "erDiagram"];
  const seen = new Set();

  for (const rel of data) {
    const key = `${rel.parent}--${rel.child}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let arrow;
    switch (rel.type) {
      case "hasMany":
        arrow = "||--o{";
        break;
      case "hasOne":
        arrow = "||--||";
        break;
      case "belongsTo":
        arrow = "||--o{";
        break;
      default:
        arrow = "||--o{";
    }
    lines.push(`  ${rel.parent} ${arrow} ${rel.child} : ""`);
  }

  lines.push("```");
  return lines.join("\n");
}

/**
 * bool-matrix: 配列 → ○/— テーブル
 *
 * @param {Object[]} data  - 各行オブジェクト。最初のフィールドがラベル、残りが boolean
 * @param {string[]} labels - テーブルヘッダー表示名
 * @returns {string}
 */
export function boolMatrix(data, labels) {
  if (!Array.isArray(data) || data.length === 0) {
    return emptyTable(labels);
  }

  const keys = Object.keys(data[0]);
  const header = `| ${labels.join(" | ")} |`;
  const sep = `| ${labels.map(() => "---").join(" | ")} |`;
  const rows = data.map((row) => {
    const cells = keys.map((k, i) => {
      if (i === 0) return String(row[k]);
      return row[k] ? "○" : "—";
    });
    return `| ${cells.join(" | ")} |`;
  });

  return [header, sep, ...rows].join("\n");
}

/**
 * renderer 名 → 関数のマップ
 */
export const RENDERERS = {
  table,
  kv,
  "mermaid-er": mermaidEr,
  "bool-matrix": boolMatrix,
};

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------
function emptyTable(labels) {
  const header = `| ${labels.join(" | ")} |`;
  const sep = `| ${labels.map(() => "---").join(" | ")} |`;
  return [header, sep, `| ${labels.map(() => "—").join(" | ")} |`].join("\n");
}
