# Contributing

connpass-pickup への貢献に興味を持っていただき、ありがとうございます。このドキュメントでは、開発環境の準備方法とリポジトリの構成について説明します。わかりにくい点があれば、Issue で質問してもらって構いません。

## リポジトリの構成

このリポジトリは pnpm workspaces によるモノレポで、次の2つのパッケージからなります。

- `pkg/` — npm パッケージ本体(`connpass-pickup`)。CLI(`pickup` コマンド)と、connpass のイベント情報をスクレイピングで取得する軽量ライブラリの両方を提供します。
- `ext/` — Chrome / Firefox 向けのブラウザ拡張機能(Manifest V3)。connpass の参加者ページに直接シャッフル機能を追加します。

両パッケージとも TypeScript + tsdown + vitest + ESLint + Prettier という同じ構成です。

## セットアップ

Node.js 22 以上と pnpm が必要です。

```sh
pnpm install
```

`pnpm-lock.yaml` は必ずコミットしてください。

## よく使うコマンド

ルートで実行すると、`pkg`/`ext` の両方に対して実行されます。

| コマンド | 内容 |
| --- | --- |
| `pnpm run build` | tsdown でビルド |
| `pnpm run test` | vitest でテストを実行(モックデータのみ、ネットワークアクセスなし) |
| `pnpm run typecheck` | `tsc --noEmit` で型チェック |
| `pnpm run format` | Prettier でフォーマットを直接書き換える |
| `pnpm run format:check` | フォーマットのチェックのみ(書き換えない) |
| `pnpm run lint` | ESLint でチェックのみ |
| `pnpm run lint:fix` | ESLint で自動修正 |
| `pnpm run check` | フォーマットと lint をまとめて自動修正 |
| `pnpm run ci` | CI と同じ内容(書き換えなし) |

`pkg/` にだけ実サイト(connpass.com)へ実際にアクセスするテストがあります。これは CI や `pnpm run test` では実行されず、次のコマンドで明示的に実行したときだけ動きます。

```sh
pnpm run test:real
```

Pull Request を送る前に、最低限次を通してください。

```sh
pnpm run ci && pnpm run typecheck && pnpm run test && pnpm run build
```

## コーディング規約

- フォーマットは Prettier、Lint は ESLint(`eslint-config-prettier` で両者が競合しないようにしています)。コミット前に `pnpm run check` を実行すれば両方直せます。
- テストは `*.test.ts` として実装ファイルの隣に置き、vitest で実行します。
- コメントや JSDoc、ドキュメント類はすべて日本語で書きます。「なぜそうしているか」が自明でない箇所にだけコメントを添えてください。
- 型のみの import には `import type` を使います(`verbatimModuleSyntax` を有効にしているため)。
- `pkg/` と `ext/` は意図的にロジックを共有していません。`ext/` は拡張機能単体で完結させるため、参加者取得・シャッフルのロジックを独立して持っています。

## Pull Request

変更はできるだけ小さくまとめ、新しい挙動には必ずテストを添えてください。

## リリース手順(メンテナー向け)

`pkg/` と `ext/` はバージョンも公開先も別々なので、リリースワークフローも分かれています。GitHub Actions からそれぞれ手動(`workflow_dispatch`)で実行してください。

### pkg(npmパッケージ)— `release-pkg` ワークフロー

`version` に `patch`/`minor`/`major`/`prerelease` のいずれか、または `6.1.0` のような明示的なバージョンを指定します。`pkg/` のチェック・ビルド・バージョン更新・npm への公開(trusted publishing、OIDC 経由で `NPM_TOKEN` は不要)・コミットとタグ(`pkg-v<version>`)の push・GitHub Release の作成までを行います。

trusted publishing は npmjs.com 側で一度だけ設定が必要です(`connpass-pickup` パッケージの Settings → Publishing access → Trusted publishers → GitHub で、このリポジトリの `release-pkg.yml` を指定します)。

### ext(ブラウザ拡張機能)— `release-ext` ワークフロー

`version` の指定方法は pkg と同様です。`ext/` のチェック・ビルド・マニフェスト(`manifest.chrome.json`/`manifest.firefox.json`)を含むバージョン更新・コミットとタグ(`ext-v<version>`)の push・GitHub Release の作成までを行います。npmへの公開は行わず、Chrome/Firefox 向けの zip を Release に添付します。各ストアへの提出は別途手動で行う必要があります。

## ライセンス

貢献していただいたコードは [MIT License](./LICENSE) の下でライセンスされることに同意したものとみなします。
