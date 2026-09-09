import { homedir } from "node:os";
import { win32, posix } from "node:path";

const APP_DIR_NAME = "connpass-pickup";

/**
 * OS標準のユーザーデータディレクトリ配下に結果保存用フォルダを決定する。npm パッケージの更新・アンインストールでは消えない場所に置くための実装で、外部パッケージには依存せず OS ごとの慣習的なパスを自前で組み立てている。
 *
 * `node:path` の既定 `join` は実行中のOSに応じて区切り文字が変わってしまい、テストで process.platform を差し替えても追従しないため、ここでは判定した platform に対応する `win32`/`posix` を明示的に使う。
 */
export function getResultsDir(): string {
  const platform = process.platform;

  if (platform === "win32") {
    const appData =
      process.env.APPDATA ?? win32.join(homedir(), "AppData", "Roaming");
    return win32.join(appData, APP_DIR_NAME, "results");
  }

  if (platform === "darwin") {
    return posix.join(
      homedir(),
      "Library",
      "Application Support",
      APP_DIR_NAME,
      "results"
    );
  }

  const xdgDataHome =
    process.env.XDG_DATA_HOME ?? posix.join(homedir(), ".local", "share");
  return posix.join(xdgDataHome, APP_DIR_NAME, "results");
}
