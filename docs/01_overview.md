# 01. ツール概要とアーキテクチャ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ツールの目的・解決する課題・主要なユースケースを踏まえること。 -->

本章では、sdd-forge がどのような課題を解決するツールであるか、その全体的なアーキテクチャと主要コンセプト、および典型的な利用フローを説明します。ソースコードの自動ドキュメント化から Spec-Driven Development によるワークフロー管理まで、ツールの目的と使い方の全体像を把握できます。

## 内容

### ツールの目的

<!-- @text: このCLIツールが解決する課題と、ターゲットユーザーを説明してください。 -->

sdd-forge は「ドキュメントが常に陳腐化する」という課題を解決するための CLI ツールです。ソースコードを機械的に解析して構造情報を抽出し、AI によるテキスト生成と組み合わせることで、コードと同期した知識ベース（`docs/`）を継続的に維持します。

機能追加・改修時には Spec-Driven Development（SDD）のワークフローをガイドします。仕様の定義 → ゲートチェック → 実装 → ドキュメント更新 → 品質レビューという一連のプロセスをコマンドラインから一貫して実行できます。

主なターゲットユーザーは、中〜大規模のソフトウェアプロジェクトを管理する開発者・チームリードです。特に、ドキュメント整備の負担を自動化しながら、仕様主導の開発規律をチームに定着させたい組織に適しています。

### アーキテクチャ概要

<!-- @text: ツール全体のアーキテクチャを mermaid flowchart で生成してください。入力・処理・出力の流れ、主要モジュールの関係を含めること。出力は mermaid コードブロックのみ。 -->

```mermaid
flowchart TD
    User([ユーザー]) -->|sdd-forge コマンド| Entry[sdd-forge.js\nエントリポイント]

    Entry --> Docs[docs.js\nドキュメント系ディスパッチャ]
    Entry --> Spec[spec.js\nSpec 系ディスパッチャ]
    Entry --> Flow[flow.js\nSDD フロー自動実行]
    Entry --> Help[help.js\nヘルプ表示]

    Docs --> Scan[scan\nソースコード解析]
    Docs --> Init[init\nテンプレート初期化]
    Docs --> Data[data\n@data ディレクティブ解決]
    Docs --> Text[text\n@text ディレクティブ解決]
    Docs --> Forge[forge\ndocs 反復改善]
    Docs --> Review[review\n品質チェック]
    Docs --> Readme[readme\nREADME 自動生成]

    Spec --> SpecInit[spec\nSpec 作成・ブランチ管理]
    Spec --> Gate[gate\nゲートチェック]

    Scan -->|構造情報を生成| AnalysisJSON[(analysis.json\nsummary.json)]
    AnalysisJSON --> Data
    AnalysisJSON --> Text

    Data -->|データ注入| DocsFiles[docs/ ファイル群]
    Text -->|AI テキスト注入| DocsFiles
    DocsFiles --> Forge
    Forge -->|AI による改善| DocsFiles
    DocsFiles --> Review

    SpecInit --> SpecFile[specs/NNN-xxx/spec.md]
    SpecFile --> Gate
    Gate -->|PASS| Impl([実装フェーズ])
    Impl --> Forge
```

### 主要コンセプト

<!-- @text: このツールを理解するうえで重要なコンセプト・用語を表形式で説明してください。 -->

| コンセプト | 説明 |
|---|---|
| **SDD（Spec-Driven Development）** | 仕様を先に定義し、ゲートチェックを経てから実装を開始する開発手法。仕様と実装の乖離を防ぎます |
| **spec** | 機能追加・修正ごとに作成する仕様書（`specs/NNN-xxx/spec.md`）。実装の起点となります |
| **gate** | spec の完成度・明確さを自動チェックする機構。PASS するまで実装を開始しません |
| **docs/** | ソースコード解析・AI 生成テキスト・手動記述で構成されるプロジェクトの知識ベースです |
| **@data ディレクティブ** | `docs/` ファイル内に記述する宣言的マーカー。`sdd-forge data` 実行時に解析データへ置換されます |
| **@text ディレクティブ** | `docs/` ファイル内に記述する宣言的マーカー。`sdd-forge text` 実行時に AI 生成テキストへ置換されます |
| **MANUAL ブロック** | `<!-- MANUAL:START -->〜<!-- MANUAL:END -->` で囲んだ手動記述領域。自動生成で上書きされません |
| **analysis.json** | `sdd-forge scan` が生成するソースコード構造データ。data・text・forge 系コマンドの入力となります |
| **summary.json** | analysis.json の軽量版。AI に渡すコマンドはこちらを優先して使用します |
| **forge** | docs の内容を AI で反復的に改善するコマンド。実装後の docs 更新にも使用します |
| **review** | docs の品質（一貫性・網羅性・正確性）を自動チェックするコマンドです |
| **preset** | CakePHP 2.x など、フレームワーク固有の解析ロジックをまとめた拡張モジュールです |

### 典型的な利用フロー

<!-- @text: ユーザーがインストールしてから最初の成果物を得るまでの典型的な手順をステップ形式で説明してください。 -->

**初期セットアップ〜ドキュメント生成**

1. **インストール**: `npm install -g sdd-forge` でグローバルインストールします。
2. **プロジェクト登録**: 対象プロジェクトのルートディレクトリで `sdd-forge setup` を実行し、設定ファイル（`.sdd-forge/`）を生成します。
3. **一括ビルド**: `sdd-forge build` を実行します。内部的に scan → init → data → text → readme → agents の順で処理が行われ、`docs/` 配下にドキュメントが生成されます。
4. **成果物の確認**: `docs/` ディレクトリに生成されたマークダウンファイルを確認します。

**機能追加・修正時のフロー**

5. **Spec 作成**: `sdd-forge spec --title "<機能名>"` で仕様書と feature ブランチを作成します。
6. **ゲートチェック**: `sdd-forge gate --spec specs/NNN-xxx/spec.md` を実行し、仕様の完成度を確認します。FAIL の場合は未解決事項を解消してから再実行します。
7. **実装**: gate が PASS したら実装を開始します。
8. **docs 更新**: 実装完了後、`sdd-forge forge --prompt "<変更内容の要約>" --spec specs/NNN-xxx/spec.md` で docs を最新状態に更新します。
9. **品質チェック**: `sdd-forge review` を実行し、PASS するまでドキュメントを改善します。
