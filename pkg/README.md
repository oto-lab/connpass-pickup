# connpass-pickup

[connpass](https://connpass.com/) のイベント参加者をランダムに並び替える CLI ツールと、connpass の各種ページをスクレイピングして扱うための軽量ライブラリです。

CLI では、結果をコンソールと HTML ファイルの両方に出力し、ブラウザで確認できます。LT 大会などで発表順を決めるのにどうぞ。
ライブラリとしても同じ機能をそのまま `import`/`require` して使えるほか、イベント検索やユーザー情報の取得など、connpass 関連の便利な関数をいくつか提供しています。

> [!Note]
> connpass には参加者一覧や詳細なユーザー情報を返す公式APIが存在しないため、このパッケージはそれらをすべて公開ページのHTMLスクレイピングで取得します(APIキーは一切不要です)。connpass 側のページ構造が変わると、動かなくなる可能性があります。

> [!Note]
> connpass の参加者ページ自体は1つの募集枠につき最大100人までしかHTMLに描画しませんが、100人を超える枠には専用の「もっと見る」ページ(ページネーションあり)が存在します。`fetchParticipants`/`fetchParticipantsDetailed` は既定でこれを自動的に辿り、100人を超えるイベントでも全件取得します(実際に150人超のイベントで動作確認済み)。取得件数を抑えたい場合は `fetchAllPages: false` を指定してください。

> [!Warning]
> このツールは実験目的で作成・公開されています。使用によって生じた損害について、作者は責任を負いません。

## インストール

```sh
npm install -g connpass-pickup@latest
```

Node.js 22 以上が必要です。

## CLI として使う

```sh
pickup
```

イベントIDやURLを直接渡すこともできます。

```sh
pickup 385269
pickup https://connpass.com/event/385269/
pickup https://smarthr.connpass.com/event/385269/
```

対話形式で「対象の参加枠」「重複排除の有無」「結果をHTMLで保存するか」「追加参加者」を聞かれたあと、シャッフルした順番をコンソールに表示します。HTML保存を選んだ場合は、保存先を開いてブラウザで結果を確認できます。

保存先はOS標準のユーザーデータディレクトリ配下です(`npm install -g` での更新やアンインストールをしても消えません)。

| OS | 保存先 |
| --- | --- |
| Windows | `%APPDATA%\connpass-pickup\results` |
| macOS | `~/Library/Application Support/connpass-pickup/results` |
| Linux | `$XDG_DATA_HOME/connpass-pickup/results` (未設定時は `~/.local/share/connpass-pickup/results`) |

User-Agent は既定で最新の一般的なデスクトップブラウザのものを自動的に使用します。独自のUAを使いたい場合や、プロキシ経由でアクセスしたい場合、リトライ・タイムアウトを調整したい場合は環境変数で上書きできます。

```sh
CONNPASS_PICKUP_USER_AGENT="任意のUA文字列" pickup 385269
CONNPASS_PICKUP_PROXY="http://127.0.0.1:8080" pickup 385269
CONNPASS_PICKUP_RETRY=3 CONNPASS_PICKUP_TIMEOUT=10000 pickup 385269
```

## ライブラリとして使う

CLI が内部で行っている処理はすべて公開APIとして呼び出せます。ESM/CJS どちらからでも利用できます。

```ts
import {
  fetchParticipants,
  shuffle,
  buildResultMarkdown,
  renderResultHtml,
  saveResult,
} from "connpass-pickup";

const participants = await fetchParticipants("385269");
const members = shuffle(participants["General Attendees / 参加枠"]);

const markdown = buildResultMarkdown("385269", members);
const html = await renderResultHtml(markdown);
await saveResult("385269", html, "html");
```

```js
const { fetchParticipants } = require("connpass-pickup");
```

### 提供している関数

| 関数 | 説明 |
| --- | --- |
| `fetchParticipants(eventId, options?)` | 参加者ページから募集枠ごとの参加者一覧を取得する(100人超の枠は自動でページ送りして全件取得) |
| `fetchParticipantsDetailed(eventId, options?)` | 参加者一覧に加え、枠ごとの取得件数・全体人数・切り詰めの有無(`truncated`)を返す |
| `shuffle(array)` | Fisher-Yates で配列をシャッフルする(非破壊) |
| `buildResultMarkdown(eventId, members)` | シャッフル結果からMarkdownを組み立てる |
| `renderResultHtml(markdown)` | MarkdownをスタイルつきのHTML文字列に変換する |
| `toJson(data)` / `toCsv(members)` | 結果をJSON/CSV文字列にする |
| `saveResult(eventId, content, format)` | 結果をOS標準のディレクトリに保存する(`format`: `html`/`markdown`/`json`/`csv`) |
| `openResult(filePath)` | 保存したファイルを既定のアプリで開く |
| `getResultsDir()` | 結果の保存先ディレクトリを取得する |
| `fetchEvent(eventId, options?)` | イベントの詳細情報(タイトル・日時・会場・募集枠の定員など)を取得する |
| `fetchEventsBatch(eventIds, options?)` | 複数イベントの情報をまとめて取得する |
| `searchEvents(params)` | キーワードや開催日、都道府県でイベントを検索する(1ページ分) |
| `searchAllEvents(params, options?)` | `searchEvents` をページ送りしながら繰り返し呼び出し、条件に合うイベントを全件まとめて取得する |
| `fetchGroupEvents(subdomain)` | connpassグループが主催するイベント一覧を取得する |
| `fetchUserProfile(nickname)` | ユーザーの公開プロフィールを取得する |
| `fetchUserEvents(nickname)` | ユーザーが参加登録したイベント一覧を取得する |
| `getDefaultUserAgent()` | 既定で使われるUser-Agentを取得する |

### リクエストの共通オプション

上記の `options` はすべて次のフィールドを受け取れます(いずれも省略可能)。

| フィールド | 説明 |
| --- | --- |
| `userAgent` | 省略時は最新の一般的なブラウザのUser-Agentを自動的に使用する |
| `proxy` | プロキシのURL(例: `"http://127.0.0.1:8080"`)。指定するとそのプロキシ経由でアクセスする |
| `retry` | リクエスト失敗時のリトライ回数([ofetch](https://github.com/unjs/ofetch)の`retry`にそのまま渡す) |
| `retryDelay` | リトライ間隔(ミリ秒) |
| `timeout` | タイムアウト(ミリ秒) |

```ts
import { fetchEvent } from "connpass-pickup";

const event = await fetchEvent("385269", {
  proxy: "http://127.0.0.1:8080",
  retry: 3,
  retryDelay: 1000,
  timeout: 10_000,
});
```

`fetchParticipants`/`fetchParticipantsDetailed` はさらに次のフィールドも受け取れます。

| フィールド | 説明 |
| --- | --- |
| `fetchAllPages` | 100人を超える枠で「もっと見る」ページを辿って全件取得するかどうか(既定値: `true`) |
| `maxPagesPerRole` | 1つの募集枠あたりのページ数上限(既定値: `20` = 2000人まで) |
| `requestDelay` | ページ間に挟む待機時間(ミリ秒、既定値: `300`)。connpassへの連続アクセスを避けるためのマナー設定 |

### 現在募集中のイベント一覧を取得する

`searchEvents`/`searchAllEvents` はキーワードが無くても、`prefectures` などの絞り込み条件が1つでもあれば呼び出せます(connpassの検索ページ自体が「絞り込み条件なし」では結果を返さない仕様のため)。これを利用して、キーワード無しで「現在募集中のイベント一覧」を取得できます。

```ts
import { searchAllEvents } from "connpass-pickup";

// オンライン開催のイベントを開催日昇順で全件取得
const events = await searchAllEvents({ prefectures: ["online"] });
```

## Git から使う

```sh
git clone https://github.com/oto-lab/connpass-pickup.git
cd connpass-pickup
pnpm install
pnpm --filter connpass-pickup run build
node pkg/dist/cli.mjs
```

## 開発

このパッケージはモノレポの一部です。開発環境のセットアップやテストの実行方法は、リポジトリルートの [CONTRIBUTING.md](../CONTRIBUTING.md) を参照してください。

## 免責事項

本ツールは実験目的で作成・公開されました。使用を推奨するものではなく、使用して発生した損害に関して作者は一切責任を負いません。
