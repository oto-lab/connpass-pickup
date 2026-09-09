import { ProxyAgent } from "undici";
import { resolveUserAgent, type UserAgentOptions } from "./user-agent.js";

export interface RequestOptions extends UserAgentOptions {
  /** プロキシのURL(例: "http://127.0.0.1:8080")。指定するとundiciのProxyAgent経由でアクセスする */
  proxy?: string;
  /** リクエスト失敗時のリトライ回数(ofetchの`retry`にそのまま渡す。既定はofetchのデフォルト) */
  retry?: number | false;
  /** リトライ間隔(ミリ秒、ofetchの`retryDelay`) */
  retryDelay?: number;
  /** タイムアウト(ミリ秒、ofetchの`timeout`) */
  timeout?: number;
}

/**
 * connpassへのofetch呼び出しに共通で渡すオプションを組み立てる。User-Agent・プロキシ・リトライ・タイムアウトの設定をすべての取得系関数で一貫させるための共通ヘルパー。
 */
export function buildFetchOptions(
  options?: RequestOptions
): Record<string, unknown> {
  const fetchOptions: Record<string, unknown> = {
    headers: { "User-Agent": resolveUserAgent(options) },
  };

  if (options?.retry !== undefined) fetchOptions.retry = options.retry;
  if (options?.retryDelay !== undefined)
    fetchOptions.retryDelay = options.retryDelay;
  if (options?.timeout !== undefined) fetchOptions.timeout = options.timeout;
  if (options?.proxy) fetchOptions.dispatcher = new ProxyAgent(options.proxy);

  return fetchOptions;
}
