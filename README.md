# connpass-pickup

[connpass](https://connpass.com/) のイベント参加者をランダムに並び替えるためのツール群です。LT大会などの発表順を決める際にどうぞ。

このリポジトリは pnpm workspaces によるモノレポで、2つのパッケージからなります。

- **[pkg/](pkg/)** — npm パッケージ本体(`connpass-pickup`)。CLI(`pickup` コマンド)と、connpass の各種ページをスクレイピングで取得する軽量ライブラリの両方を提供します。詳しい使い方は [pkg/README.md](pkg/README.md) を参照してください。
- **[ext/](ext/)** — Chrome / Firefox 向けブラウザ拡張機能(Manifest V3)。connpass の参加者ページを開いたまま、その場でシャッフルできます。詳しい使い方は [ext/README.md](ext/README.md) を参照してください。

## Quick Start

```sh
npm install -g connpass-pickup@latest
pickup 385269
```

`pkg/` はプログラムから呼び出せるライブラリとしても使えます。

```ts
import { fetchParticipants, shuffle } from "connpass-pickup";

const participants = await fetchParticipants("385269");
console.log(shuffle(participants["General Attendees / 参加枠"]));
```

## 開発

```sh
git clone https://github.com/oto-lab/connpass-pickup.git
cd connpass-pickup
pnpm install
pnpm run build
```

開発環境のセットアップやコーディング規約、リリース手順については [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 免責事項

本ツール(以下、ツール)は実験目的で作成・公開されました。
ツールの使用を推奨しません。
ツールを使用して発生した損害に関しては一切責任を負いません。

## License

[MIT](LICENSE)
