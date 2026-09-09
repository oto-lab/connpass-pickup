import type { RequestOptions } from "../http.js";
import { fetchEvent, type EventDetail } from "./fetch-event.js";

export interface FetchEventsBatchOptions extends RequestOptions {
  /** 同時に実行するリクエスト数(既定値: 2) */
  concurrency?: number;
}

const DEFAULT_CONCURRENCY = 2;

/**
 * 複数の eventId をまとめて処理する。connpass への同時アクセス数を抑えるため、
 * 外部キューライブラリは使わず配列をチャンクに分けて順番に処理する簡易実装。
 */
export async function fetchEventsBatch(
  eventIds: string[],
  options?: FetchEventsBatchOptions
): Promise<Record<string, EventDetail>> {
  const concurrency = Math.max(1, options?.concurrency ?? DEFAULT_CONCURRENCY);
  const result: Record<string, EventDetail> = {};

  for (let i = 0; i < eventIds.length; i += concurrency) {
    const chunk = eventIds.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((eventId) => fetchEvent(eventId, options))
    );
    chunk.forEach((eventId, index) => {
      result[eventId] = chunkResults[index];
    });
  }

  return result;
}
