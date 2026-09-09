# connpass pickup(ブラウザ拡張機能)

[connpass](https://connpass.com/) のイベント参加者ページに、その場でシャッフル機能を追加する Chrome / Firefox 向け拡張機能(Manifest V3)です。

connpass のイベント参加者ページ(`https://*.connpass.com/event/*/participation*`)を開くと、右下にボタンが表示されます。押すとパネルが開き、募集枠の選択・重複排除・追加参加者の入力・シャッフルをそのページ上だけで完結できます。結果はコピーするか、HTMLファイルとしてダウンロードできます。

> [!Note]
> npm パッケージ版(`pkg/`)とはロジックを共有していません。拡張機能単体でネットワークアクセスなしに完結させるため、独立して実装しています。

## ビルド

リポジトリルートで依存関係をインストールし、このパッケージをビルドします。

```sh
pnpm install
pnpm --filter connpass-pickup-ext run build
```

`dist/chrome/` と `dist/firefox/` に、それぞれのブラウザ向けの拡張機能一式(`manifest.json` / `content.js` / `styles.css` / `icons/`)が生成されます。

## ブラウザへの読み込み方

### Chrome

1. `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」から `ext/dist/chrome` を選択する

### Firefox

1. `about:debugging#/runtime/this-firefox` を開く
2. 「一時的なアドオンを読み込む」から `ext/dist/firefox` 配下の `manifest.json` を選択する

## 配布用パッケージの作成

各ストアに提出する成果物を作りたい場合は、次のコマンドを実行します。

```sh
pnpm --filter connpass-pickup-ext run package
```

`dist/chrome.zip`(通常のzip)と、[web-ext](https://github.com/mozilla/web-ext) でビルドした `dist/firefox.xpi`(Firefox向け、manifestの妥当性チェック込み)が生成されます。`--target=chrome`/`--target=firefox` を付けると、どちらか一方だけをビルドできます。

```sh
pnpm --filter connpass-pickup-ext exec node scripts/build.mjs --zip --target=firefox
```

各ストアへの実際の提出は手動で行う必要があります。

## 開発

このパッケージはモノレポの一部です。開発環境のセットアップやテストの実行方法は、リポジトリルートの [CONTRIBUTING.md](../CONTRIBUTING.md) を参照してください。
