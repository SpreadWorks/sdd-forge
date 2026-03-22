# Draft: fix ignoreError behavior and implement header/footer params

## Q&A Summary

### Q1: ignoreError: true で null 時のディレクティブ間コンテンツ
- **A**: ディレクティブ行は残し、コンテンツはクリアする

### Q2: header/footer + ignoreError で null 時の動作
- **A**: ディレクティブを残し、コンテンツ（header/footer含む）をクリアする

### Q3: header/footer の出力形式
- **A**: header の値 → データ → footer の値をそのまま出力する。余分な改行挿入はしない

### Q4: テンプレート修正対象
- **A**: 全プリセットのテンプレートを一括チェックして修正する

### Q5: テンプレート修正方針
- **A**: `ignoreError: true` の有無に関わらず、すべての `{{data}}` ディレクティブを見直す

### Q6: header/footer の複数行対応
- **A**: `\n` リテラルを改行として解釈する。parseOptions の修正で対応

## Decisions

1. `ignoreError: true` で null 返却時: ディレクティブ行を保持し、間のコンテンツをクリアする（現行は removeDirective で行ごと削除）
2. `header` / `footer` パラメータ: データありなら header+data+footer を出力、null なら何も出さない
3. `\n` エスケープ: parseOptions で quoted string 内の `\n` を改行文字に変換
4. テンプレート修正: 全プリセットの全 `{{data}}` ディレクティブを見直し、見出しを header に移動する等の最適化を行う

- [x] User approved this draft (2026-03-22)
