import { ofetch } from "ofetch";
import * as cheerio from "cheerio";
import { buildFetchOptions, type RequestOptions } from "../http.js";
import {
  parseEventListCards,
  type EventListCard,
} from "../events/parse-event-list-card.js";

export interface UserProfile {
  nickname: string;
  displayName?: string;
  bio?: string;
  iconUrl?: string;
  joinedAt?: string;
  twitterUrl?: string;
  githubUrl?: string;
}

export type UserEventSummary = EventListCard;

function userUrl(nickname: string): string {
  return `https://connpass.com/user/${nickname}/`;
}

/**
 * connpass のユーザープロフィールページをスクレイピングする。
 * 公式APIにはユーザー情報を返すエンドポイントが存在しないための代替実装。
 */
export async function fetchUserProfile(
  nickname: string,
  options?: RequestOptions
): Promise<UserProfile> {
  const html = await ofetch(userUrl(nickname), buildFetchOptions(options));

  const $ = cheerio.load(html);
  const header = $(".profile_header_area").first();

  const displayName =
    header.find(".title_2").first().text().trim() || undefined;
  const iconUrl = header.find(".avatar img").first().attr("src");
  const bio = header.find("> p").first().text().trim() || undefined;

  const joinedAtText = header.find(".profile_date").first().text().trim();
  const joinedAt =
    joinedAtText.replace(/^利用開始日\s*[:：]\s*/, "") || undefined;

  const twitterUrl = header
    .find('.social_link a[title="X(Twitter)を見る"]')
    .first()
    .attr("href");
  const githubUrl = header
    .find('.social_link a[title="GitHubを見る"]')
    .first()
    .attr("href");

  return {
    nickname,
    displayName,
    bio,
    iconUrl,
    joinedAt,
    twitterUrl,
    githubUrl,
  };
}

/**
 * ユーザープロフィールページに含まれる、参加登録済みイベント一覧を取得する。
 * 廃止された API v1 の nickname 検索に相当する機能を代替する。
 */
export async function fetchUserEvents(
  nickname: string,
  options?: RequestOptions
): Promise<UserEventSummary[]> {
  const html = await ofetch(userUrl(nickname), buildFetchOptions(options));

  const $ = cheerio.load(html);
  return parseEventListCards($);
}
