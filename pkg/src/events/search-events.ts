import { ofetch } from "ofetch";
import * as cheerio from "cheerio";
import { buildFetchOptions, type RequestOptions } from "../http.js";
import {
  parseEventListCards,
  type EventListCard,
} from "./parse-event-list-card.js";

const SEARCH_URL = "https://connpass.com/search/";

export interface SearchEventsParams extends RequestOptions {
  /** キーワード(AND検索、v1 API の keyword に相当) */
  keyword?: string;
  /** 開催日の範囲(v1 API の ym/ymd に相当)。"YYYY-MM-DD" 形式 */
  dateFrom?: string;
  dateTo?: string;
  /** 都道府県コード(例: "tokyo")または "online"。複数指定可 */
  prefectures?: string[];
  /** 開催日昇順は未指定、降順は "2" */
  sort?: "" | "2";
  /** ページ番号(1始まり) */
  page?: number;
}

export type SearchEventSummary = EventListCard;

function hasAnyFilter(params: SearchEventsParams): boolean {
  return Boolean(
    params.keyword ||
    params.dateFrom ||
    params.dateTo ||
    params.prefectures?.length
  );
}

/**
 * connpass のイベント検索ページをスクレイピングする。廃止された API v1 の keyword/ym/ymd/start(ページング)/order 相当の検索を、APIキー不要の `/search/` ページで代替する。
 *
 * connpass の検索ページ自体の仕様として、`keyword`/`dateFrom`/`dateTo`/`prefectures` のいずれも指定しないと検索結果が0件になる(キーワード検索必須ではないが、何らかの絞り込み条件は必須)。キーワード無しで「現在募集中のイベント一覧」を取得したい場合は、`prefectures: ["online"]` のように地域だけを指定すればよい。
 */
export async function searchEvents(
  params: SearchEventsParams = {}
): Promise<SearchEventSummary[]> {
  if (!hasAnyFilter(params)) {
    throw new Error(
      "searchEvents: keyword/dateFrom/dateTo/prefecturesのいずれかを指定してください(connpassの検索ページは絞り込み条件なしでは結果を返しません)"
    );
  }

  const query: Record<string, string | number> = {};
  if (params.keyword) query.q = params.keyword;
  if (params.dateFrom) query.start_from = params.dateFrom;
  if (params.dateTo) query.start_to = params.dateTo;
  if (params.sort) query.sort = params.sort;
  if (params.page) query.page = params.page;

  const html = await ofetch(SEARCH_URL, {
    ...buildFetchOptions(params),
    query: {
      ...query,
      ...(params.prefectures?.length
        ? { prefectures: params.prefectures }
        : {}),
    },
  });

  const $ = cheerio.load(html);
  return parseEventListCards($);
}

export interface SearchAllEventsOptions {
  /** 取得するページ数の上限(既定値: 20。1ページ20件程度のため既定で最大400件相当) */
  maxPages?: number;
}

/**
 * `searchEvents` を`page`を進めながら繰り返し呼び出し、条件に一致するイベントを全件(または`maxPages`で指定した上限まで)まとめて取得する。「現在募集中のイベント一覧」のような、1ページに収まらない検索結果をまとめて扱いたい場合に使う。
 */
export async function searchAllEvents(
  params: SearchEventsParams = {},
  options: SearchAllEventsOptions = {}
): Promise<SearchEventSummary[]> {
  const maxPages = Math.max(1, options.maxPages ?? 20);
  const events: SearchEventSummary[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const pageEvents = await searchEvents({ ...params, page });
    if (pageEvents.length === 0) break;
    events.push(...pageEvents);
  }

  return events;
}
