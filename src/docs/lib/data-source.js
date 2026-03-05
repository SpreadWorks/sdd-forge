/**
 * DataSource — base class for OOP-based {{data}} directive resolvers.
 *
 * Each preset category (e.g. controllers, models, tables) extends this class
 * and implements one or more named resolver methods.
 *
 * Directive syntax:
 *   {{data: controllers.list("Name|File|Description")}}
 *   Calls controllersSource.list(analysis, ["Name", "File", "Description"])
 */
export class DataSource {
  /**
   * Inject project-specific helpers (called by resolver-factory).
   * @param {{ desc: function, loadOverrides: function }} ctx
   */
  init(ctx) {
    this._desc = ctx.desc;
    this._loadOverrides = ctx.loadOverrides;
  }

  /**
   * Look up a description string from overrides.json.
   * @param {string} section
   * @param {string} key
   * @returns {string}
   */
  desc(section, key) {
    return this._desc ? this._desc(section, key) : "—";
  }

  /**
   * Load the full overrides.json object.
   * @returns {Object}
   */
  overrides() {
    return this._loadOverrides ? this._loadOverrides() : {};
  }

  /**
   * Convert items to row arrays using a mapper function.
   * @param {Array} items - source items
   * @param {Function} mapper - (item) => [col1, col2, ...]
   * @returns {Array<Array>} rows
   */
  toRows(items, mapper) {
    return items.map(mapper);
  }

  /**
   * Generate a Markdown table from rows and labels.
   * @param {Array<Array>} rows - [[col1, col2, ...], ...]
   * @param {string[]} labels - column headers
   * @returns {string} Markdown table
   */
  toMarkdownTable(rows, labels) {
    const escape = (v) => String(v ?? "—").replace(/\|/g, "\\|");
    const header = `| ${labels.map(escape).join(" | ")} |`;
    const sep = `| ${labels.map(() => "---").join(" | ")} |`;
    const body = rows
      .map((r) => `| ${r.map(escape).join(" | ")} |`)
      .join("\n");
    return [header, sep, body].join("\n");
  }
}
