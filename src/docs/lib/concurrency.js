/**
 * src/docs/lib/concurrency.js
 *
 * 並列実行キューユーティリティ。
 */

/**
 * items を最大 concurrency 個ずつ並列に worker で処理する。
 * 結果は入力順で返す。各要素は { value, error } 形式。
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<Array<{value: R|null, error: Error|null}>>}
 */
export async function mapWithConcurrency(items, concurrency, worker) {
  const limit = Math.max(1, Number(concurrency) || 1);
  const results = new Array(items.length);
  await new Promise((resolve) => {
    let running = 0;
    let idx = 0;
    function next() {
      if (idx >= items.length && running === 0) {
        resolve();
        return;
      }
      while (running < limit && idx < items.length) {
        const itemIdx = idx++;
        running++;
        Promise.resolve(worker(items[itemIdx], itemIdx))
          .then((value) => {
            results[itemIdx] = { value, error: null };
          })
          .catch((error) => {
            results[itemIdx] = { value: null, error };
          })
          .finally(() => {
            running--;
            next();
          });
      }
    }
    next();
  });
  return results;
}
