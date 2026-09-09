import { shuffle } from "./core/shuffle.js";
import {
  buildResultMarkdown,
  renderResultHtml,
  toJson,
  toCsv,
  saveResult,
  openResult,
  type ResultFormat,
  type OpenOptions,
} from "./core/result.js";
import { getResultsDir } from "./paths.js";
import type { RequestOptions } from "./http.js";
import {
  fetchParticipants,
  fetchParticipantsDetailed,
  type FetchParticipantsOptions,
} from "./participants/fetch-participants.js";
import { fetchEvent } from "./events/fetch-event.js";
import {
  fetchEventsBatch,
  type FetchEventsBatchOptions,
} from "./events/fetch-events-batch.js";
import {
  searchEvents,
  searchAllEvents,
  type SearchEventsParams,
  type SearchAllEventsOptions,
} from "./events/search-events.js";
import { fetchGroupEvents } from "./events/fetch-group-events.js";
import { fetchUserProfile, fetchUserEvents } from "./users/fetch-user.js";

/**
 * {@link ConnpassClient} に既定値として渡せるオプション。個々のメソッド呼び出しで渡したオプションが優先され、未指定のフィールドだけここでの設定にフォールバックする。
 */
export interface ConnpassClientOptions extends FetchParticipantsOptions {
  /** {@link ConnpassClient.fetchEventsBatch} の既定の同時実行数 */
  concurrency?: number;
}

/**
 * User-Agent・プロキシ・リトライ・タイムアウトなどを一度だけ設定して使い回すためのクライアント。connpass-pickup の全機能をメソッドとして呼び出せる。
 *
 * モジュールレベルの関数(`fetchParticipants` 等)を毎回同じオプション付きで呼び出す代わりに、次のように使う。
 *
 * ```ts
 * const client = new ConnpassClient({ proxy: "http://127.0.0.1:8080", retry: 3 });
 * const participants = await client.fetchParticipants("385269");
 * const event = await client.fetchEvent("385269");
 * ```
 */
export class ConnpassClient {
  #defaults: ConnpassClientOptions;

  constructor(options: ConnpassClientOptions = {}) {
    this.#defaults = options;
  }

  /** 呼び出し時に渡されたオプションを、コンストラクタの既定値の上に重ねる */
  #merge<T extends object | undefined>(options?: T): T {
    return { ...this.#defaults, ...(options ?? {}) } as T;
  }

  // --- participants -------------------------------------------------

  fetchParticipants(eventId: string, options?: FetchParticipantsOptions) {
    return fetchParticipants(eventId, this.#merge(options));
  }

  fetchParticipantsDetailed(
    eventId: string,
    options?: FetchParticipantsOptions
  ) {
    return fetchParticipantsDetailed(eventId, this.#merge(options));
  }

  // --- events ---------------------------------------------------------

  fetchEvent(eventId: string, options?: RequestOptions) {
    return fetchEvent(eventId, this.#merge(options));
  }

  fetchEventsBatch(eventIds: string[], options?: FetchEventsBatchOptions) {
    return fetchEventsBatch(eventIds, this.#merge(options));
  }

  searchEvents(params: SearchEventsParams = {}) {
    return searchEvents(this.#merge(params));
  }

  searchAllEvents(
    params: SearchEventsParams = {},
    options?: SearchAllEventsOptions
  ) {
    return searchAllEvents(this.#merge(params), options);
  }

  fetchGroupEvents(subdomain: string, options?: RequestOptions) {
    return fetchGroupEvents(subdomain, this.#merge(options));
  }

  // --- users ------------------------------------------------------------

  fetchUserProfile(nickname: string, options?: RequestOptions) {
    return fetchUserProfile(nickname, this.#merge(options));
  }

  fetchUserEvents(nickname: string, options?: RequestOptions) {
    return fetchUserEvents(nickname, this.#merge(options));
  }

  // --- results (ネットワークアクセスを伴わないユーティリティ) ---------------

  shuffle<T>(items: readonly T[]): T[] {
    return shuffle(items);
  }

  buildResultMarkdown(eventId: string, members: string[]): string {
    return buildResultMarkdown(eventId, members);
  }

  renderResultHtml(markdown: string): Promise<string> {
    return renderResultHtml(markdown);
  }

  toJson(data: unknown): string {
    return toJson(data);
  }

  toCsv(members: string[]): string {
    return toCsv(members);
  }

  saveResult(
    eventId: string,
    content: string,
    format: ResultFormat
  ): Promise<string> {
    return saveResult(eventId, content, format);
  }

  openResult(filePath: string, options?: OpenOptions): Promise<void> {
    return openResult(filePath, options);
  }

  getResultsDir(): string {
    return getResultsDir();
  }
}
