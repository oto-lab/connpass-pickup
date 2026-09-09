import { ofetch } from "ofetch";
import * as cheerio from "cheerio";
import { buildFetchOptions, type RequestOptions } from "../http.js";
import {
  parseEventListCards,
  type EventListCard,
} from "./parse-event-list-card.js";

export type GroupEventSummary = EventListCard;

/**
 * connpass のグループ(サブドメインサイト)のトップページをスクレイピングし、
 * そのグループが主催するイベント一覧を取得する。
 * 廃止された API v1 の series_id 検索に相当する機能を代替する。
 */
export async function fetchGroupEvents(
  subdomain: string,
  options?: RequestOptions
): Promise<GroupEventSummary[]> {
  const url = `https://${subdomain}.connpass.com/`;
  const html = await ofetch(url, buildFetchOptions(options));

  const $ = cheerio.load(html);
  return parseEventListCards($, ".group_event_list.vevent");
}
