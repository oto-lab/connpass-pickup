import desktopUserAgents from "top-user-agents/desktop";

// top-user-agents が万一空配列を返した場合のための最終フォールバック。
const FALLBACK_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * 現在よく使われているデスクトップブラウザの User-Agent を返す。`top-user-agents` パッケージが定期的に自動更新している実データ上位のリストから先頭(最も一般的なもの)を採用する。
 */
export function getDefaultUserAgent(): string {
  return desktopUserAgents[0] ?? FALLBACK_USER_AGENT;
}

export interface UserAgentOptions {
  /** 省略時は {@link getDefaultUserAgent} の値を使う */
  userAgent?: string;
}

/**
 * オプションで渡された User-Agent があればそれを、無ければデフォルト値を返す。
 * connpass へアクセスする各関数が共通で使う解決ロジック。
 */
export function resolveUserAgent(options?: UserAgentOptions): string {
  return options?.userAgent ?? getDefaultUserAgent();
}
