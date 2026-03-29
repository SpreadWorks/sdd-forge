/**
 * src/lib/flow-envelope.js
 *
 * JSON envelope utility for flow get/set/run commands.
 * All flow commands return this common envelope format.
 */

/**
 * Create a success envelope.
 * @param {string} type - "get", "set", or "run"
 * @param {string} key - command key (e.g. "status", "step", "merge")
 * @param {*} data - response data
 * @returns {{ ok: true, type: string, key: string, data: *, errors: [] }}
 */
export function ok(type, key, data) {
  return { ok: true, type, key, data, errors: [] };
}

/**
 * Create a failure envelope.
 * @param {string} type - "get", "set", or "run"
 * @param {string} key - command key
 * @param {string} code - machine-readable error code
 * @param {string|string[]} messages - human-readable error message(s)
 * @returns {{ ok: false, type: string, key: string, data: null, errors: Array }}
 */
export function fail(type, key, code, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return {
    ok: false, type, key, data: null,
    errors: [{ level: "fatal", code, messages: msgs }],
  };
}

/**
 * Create a success envelope with a warning.
 * @param {string} type - "get", "set", or "run"
 * @param {string} key - command key
 * @param {*} data - response data
 * @param {string} code - warning code
 * @param {string|string[]} messages - warning message(s)
 * @returns {{ ok: true, type: string, key: string, data: *, errors: Array }}
 */
export function warn(type, key, data, code, messages) {
  const msgs = Array.isArray(messages) ? messages : [messages];
  return {
    ok: true, type, key, data,
    errors: [{ level: "warn", code, messages: msgs }],
  };
}

/**
 * Print envelope as JSON to stdout and exit with appropriate code.
 * @param {Object} envelope - envelope from ok(), fail(), or warn()
 */
export function output(envelope) {
  console.log(JSON.stringify(envelope, null, 2));
  process.exit(envelope.ok ? 0 : 1);
}
