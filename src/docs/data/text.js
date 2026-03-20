/**
 * src/docs/data/text.js
 *
 * TextDataSource — AI テキスト生成を DataSource メカニズムに統合する。
 *
 * {{text({prompt: "...", mode: "deep"})}} は {{data("base.text", ...)}} の
 * シンタックスシュガーとして機能する。
 *
 * data パイプライン（resolveDataDirectives）から呼び出された場合、
 * テキスト生成は非同期処理が必要なため null を返し、
 * text.js コマンドが後続で実際の LLM 呼び出しを行う。
 *
 * text.js からの直接呼び出し（generate メソッド）では、
 * オプションを受け取り LLM 応答を返す。
 */

import { DataSource } from "../lib/data-source.js";

export default class TextSource extends DataSource {
  /**
   * data パイプラインからの同期呼び出し。
   * テキスト生成は非同期処理が必要なため、data パイプラインからは
   * null を返して text.js コマンドに委譲する。
   *
   * @param {Object} _analysis - analysis.json データ
   * @param {string[]} _labels - ラベル配列（text では未使用）
   * @returns {null} 常に null（text.js に委譲）
   */
  generate(_analysis, _labels) {
    return null;
  }
}
