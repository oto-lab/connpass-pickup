import { ofetch } from "ofetch";
import * as cheerio from "cheerio";
import { buildFetchOptions, type RequestOptions } from "../http.js";
import { parseIcsEvent } from "./parse-ics.js";

export interface EventPtype {
  name: string;
  /** 参加費のテキスト(例: "無料") */
  fee?: string;
  /** 定員・受付状況のテキストをそのまま保持する(例: "13/12") */
  capacityText?: string;
}

export interface EventDetail {
  eventId: string;
  title: string;
  subtitle?: string;
  ownerName?: string;
  url: string;
  startedAt?: Date;
  endedAt?: Date;
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ptypes: EventPtype[];
}

function eventUrl(eventId: string): string {
  return `https://connpass.com/event/${eventId}/`;
}

function icsUrl(eventId: string): string {
  return `https://connpass.com/event/${eventId}.ics`;
}

function parseNumber(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const value = Number(text.trim());
  return Number.isFinite(value) ? value : undefined;
}

/**
 * connpass のイベント詳細ページと .ics ファイルをスクレイピングし、
 * イベントの基本情報を取得する。APIキーは不要。
 * 日時は HTML 上のローカライズされた文字列ではなく .ics の DTSTART/DTEND から取得する。
 */
export async function fetchEvent(
  eventId: string,
  options?: RequestOptions
): Promise<EventDetail> {
  const fetchOptions = buildFetchOptions(options);

  const [html, ics] = await Promise.all([
    ofetch(eventUrl(eventId), fetchOptions),
    ofetch(icsUrl(eventId), fetchOptions),
  ]);

  const $ = cheerio.load(html);
  const icsEvent = parseIcsEvent(ics);

  const title = $(".current_event_title").first().text().trim();
  const subtitle = $(".event_subtitle").first().text().trim() || undefined;
  const ownerNameRaw = $(".event_owner").first().text().trim();
  const ownerName = ownerNameRaw.replace(/^主催\s*[:：]\s*/, "") || undefined;

  const placeName = $(".place_name .fn.org").first().text().trim() || undefined;
  const address = $(".adr .value-title").first().attr("title")?.trim();
  const latitude = parseNumber(
    $(".geo .latitude .value-title").first().attr("title")
  );
  const longitude = parseNumber(
    $(".geo .longitude .value-title").first().attr("title")
  );

  const ptypes: EventPtype[] = [];
  $(".event_ptype_area .ptype").each((_, element) => {
    const node = $(element);
    const name = node.find(".ptype_name").first().text().trim();
    if (!name) return;

    const fee = node.find(".join_fee").first().text().trim() || undefined;
    const capacityText =
      node.find(".participants .amount").first().text().trim() || undefined;

    ptypes.push({ name, fee, capacityText });
  });

  return {
    eventId,
    title: title || icsEvent.summary || "",
    subtitle,
    ownerName,
    url: icsEvent.url ?? eventUrl(eventId),
    startedAt: icsEvent.startedAt,
    endedAt: icsEvent.endedAt,
    placeName,
    address,
    latitude,
    longitude,
    ptypes,
  };
}
