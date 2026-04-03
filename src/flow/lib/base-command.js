/**
 * src/flow/lib/base-command.js
 *
 * Base class for all flow commands.
 * Subclasses implement execute(ctx) which returns a plain object or throws Error.
 * No CLI concerns (output, parseArgs, process.exitCode) allowed in this layer.
 */

export class FlowCommand {
  /**
   * @param {Object} [options]
   * @param {boolean} [options.requiresFlow=true] - Whether this command requires an active flow
   */
  constructor({ requiresFlow = true } = {}) {
    this.requiresFlow = requiresFlow;
  }

  /**
   * Run the command with common validation.
   * @param {Object} ctx - Command context (root, flowState, config, parsed CLI args merged in)
   * @returns {Promise<Object>|Object} - Plain result object
   * @throws {Error} - On failure
   */
  async run(ctx) {
    if (this.requiresFlow && !ctx.flowState) {
      throw new Error("no active flow (flow.json not found)");
    }
    return this.execute(ctx);
  }

  /**
   * Command logic. Must be overridden by subclasses.
   * @param {Object} ctx
   * @returns {Promise<Object>|Object} - Plain result object
   * @throws {Error} - On failure
   */
  execute(ctx) {
    throw new Error("execute() must be implemented by subclass");
  }
}
