import { ofetch } from "ofetch";
import * as cheerio from "cheerio";
import { buildFetchOptions, type RequestOptions } from "../http.js";

const PARTICIPATION_URL_TEMPLATE =
  "https://connpass.com/event/[id]/participation/";

/** 募集枠名をキー、参加者の表示名一覧を値とするマップ */
export type Participants = Record<string, string[]>;

export interface ParticipantRoleInfo {
  /** 募集枠名 */
  role: string;
  /** 実際に取得できた人数 */
  fetchedCount: number;
  /** ページ上部に表示されている定員/申込人数の表記から読み取った総人数(取得できない場合はundefined) */
  totalCount?: number;
  /** 何らかの理由で全件取得できず、一部の参加者しか取得できていない場合にtrue */
  truncated: boolean;
}

export interface ParticipantsDetail {
  participants: Participants;
  roles: ParticipantRoleInfo[];
}

export interface FetchParticipantsOptions extends RequestOptions {
  /**
   * 募集枠の人数が100人を超える場合、connpassの「もっと見る」機能
   * (`/event/[id]/ptype/[ptypeId]/participants/`、ページネーションあり)
   * を辿って全件取得するかどうか。既定値: true。
   * falseにすると、参加者ページに最初に描画される先頭100人分だけを返す
   * (リクエスト数を抑えたい場合向け)。
   */
  fetchAllPages?: boolean;
  /**
   * 「もっと見る」を辿る際の、1つの募集枠あたりのページ数上限(暴走防止の安全策)。
   * 1ページ100人として、既定値20は2000人まで対応する。
   */
  maxPagesPerRole?: number;
  /**
   * 「もっと見る」のページを連続で取得する際、リクエストの間に挟む待機時間(ミリ秒)。
   * connpassへの短時間の連続アクセスを避けるためのマナー設定。既定値: 300ms。
   */
  requestDelay?: number;
}

const DEFAULT_MAX_PAGES_PER_ROLE = 20;
const DEFAULT_REQUEST_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractDisplayName(
  $: cheerio.CheerioAPI,
  userElement: unknown
): string {
  const element = $(userElement as never);
  const name = element.text().trim();
  const href = element.attr("href");
  const match = href ? href.match(/user\/([^/]+)/) : null;
  const username = match ? match[1] : "";
  return `${name} (${username})`;
}

type CheerioSelection = ReturnType<cheerio.CheerioAPI>;

function extractTotalCount(node: CheerioSelection): number | undefined {
  const text = node.find("thead .participants_count").first().text().trim();
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function extractDisplayNames(
  $: cheerio.CheerioAPI,
  root: CheerioSelection
): string[] {
  const names: string[] = [];
  root.find("tbody .user .display_name a").each((_, user) => {
    names.push(extractDisplayName($, user));
  });
  return names;
}

/**
 * 募集枠の表内にある「もっと見る」リンク(`tr.empty a`)のURLを取得する。
 * 100人を超える枠だけに存在する、専用のページネーション付き参加者一覧へのリンク。
 */
function extractMoreLink(root: CheerioSelection): string | undefined {
  const link = root.find("tr.empty a[href]").first();
  return link.length ? link.attr("href") : undefined;
}

function hasNextPage($: cheerio.CheerioAPI): boolean {
  let found = false;
  $(".paging_area a").each((_, el) => {
    if ($(el).text().includes("次へ")) found = true;
  });
  return found;
}

/**
 * 「もっと見る」の先にある専用ページ(`/event/[id]/ptype/[ptypeId]/participants/`)をページネーションが尽きるまで辿り、その募集枠の参加者を全件取得する。
 */
async function fetchAllPtypeParticipants(
  moreLinkUrl: string,
  options: FetchParticipantsOptions | undefined
): Promise<{ names: string[]; totalCount?: number; truncated: boolean }> {
  const maxPages = Math.max(
    1,
    options?.maxPagesPerRole ?? DEFAULT_MAX_PAGES_PER_ROLE
  );
  const names: string[] = [];
  let totalCount: number | undefined;
  const requestDelay = options?.requestDelay ?? DEFAULT_REQUEST_DELAY_MS;

  for (let page = 1; page <= maxPages; page++) {
    if (page > 1 && requestDelay > 0) {
      await sleep(requestDelay);
    }

    const pageUrl = page === 1 ? moreLinkUrl : `${moreLinkUrl}?page=${page}`;
    const html = await ofetch(pageUrl, buildFetchOptions(options));
    const $ = cheerio.load(html);
    const table = $(".participants_table").first();

    if (page === 1) {
      totalCount = extractTotalCount(table);
    }

    names.push(...extractDisplayNames($, table));

    if (!hasNextPage($)) {
      return { names, totalCount, truncated: false };
    }
  }

  // ページ数上限に達しても「次へ」が残っていた場合
  return { names, totalCount, truncated: true };
}

async function resolveRole(
  roleName: string,
  root: CheerioSelection,
  fallbackNames: string[],
  options: FetchParticipantsOptions | undefined
): Promise<{ names: string[]; info: ParticipantRoleInfo }> {
  const totalCount = extractTotalCount(root);
  const moreLink = extractMoreLink(root);
  const fetchAllPages = options?.fetchAllPages ?? true;

  if (moreLink && fetchAllPages) {
    const all = await fetchAllPtypeParticipants(moreLink, options);
    return {
      names: all.names,
      info: {
        role: roleName,
        fetchedCount: all.names.length,
        totalCount: all.totalCount ?? totalCount,
        truncated: all.truncated,
      },
    };
  }

  return {
    names: fallbackNames,
    info: {
      role: roleName,
      fetchedCount: fallbackNames.length,
      totalCount,
      truncated: totalCount !== undefined && totalCount > fallbackNames.length,
    },
  };
}

/**
 * connpass のイベント参加者ページをスクレイピングし、募集枠ごとの参加者一覧と、
 * 取得件数に関するメタ情報(全体人数・切り詰めの有無)を取得する。
 *
 * connpass の参加者ページ自体は1つの募集枠につき最大100人までしかHTMLに描画しないが、
 * 100人を超える枠には専用の「もっと見る」ページ(ページネーションあり)が存在するため、
 * 既定ではそれを辿って全件取得する(`fetchAllPages: false` で無効化できる)。
 */
export async function fetchParticipantsDetailed(
  eventId: string,
  options?: FetchParticipantsOptions
): Promise<ParticipantsDetail> {
  const url = PARTICIPATION_URL_TEMPLATE.replace("[id]", eventId);
  const html = await ofetch(url, buildFetchOptions(options));

  const $ = cheerio.load(html);
  const participants: Participants = {};
  const roles: ParticipantRoleInfo[] = [];

  const adminTable = $(".concerned_area .participants_table");
  if (adminTable.length) {
    const adminNames = extractDisplayNames($, adminTable);
    if (adminNames.length > 0) {
      const { names, info } = await resolveRole(
        "☆管理者",
        adminTable,
        adminNames,
        options
      );
      participants[info.role] = names;
      roles.push(info);
    }
  }

  const sections = $(".participation_table_area").toArray();
  for (const section of sections) {
    const sectionNode = $(section);
    const roleNameElement = sectionNode.find("thead .label_ptype_name");
    if (!roleNameElement.length) continue;

    const roleName = roleNameElement.first().text().trim();
    const names = extractDisplayNames($, sectionNode);
    if (names.length === 0) continue;

    const resolved = await resolveRole(roleName, sectionNode, names, options);
    participants[resolved.info.role] = resolved.names;
    roles.push(resolved.info);
  }

  return { participants, roles };
}

/**
 * connpass のイベント参加者ページをスクレイピングし、募集枠ごとの参加者一覧を取得する。
 * connpass の公式APIには参加者一覧を返すエンドポイントが存在しないため、
 * この機能は常にHTMLスクレイピングで実現している(APIキー不要)。
 *
 * 100人を超える枠は既定で「もっと見る」ページを辿って全件取得する(`options.fetchAllPages: false` で無効化可能)。取得できた人数や切り詰めの有無を確認したい場合は {@link fetchParticipantsDetailed} を使う。
 */
export async function fetchParticipants(
  eventId: string,
  options?: FetchParticipantsOptions
): Promise<Participants> {
  const { participants } = await fetchParticipantsDetailed(eventId, options);
  return participants;
}
