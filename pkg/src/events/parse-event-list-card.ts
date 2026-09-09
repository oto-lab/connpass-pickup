import type { CheerioAPI } from "cheerio";

export interface EventListCard {
  eventId: string;
  title: string;
  url: string;
  seriesTitle?: string;
  ownerName?: string;
  place?: string;
  startedAt?: string;
  endedAt?: string;
  capacityText?: string;
}

function extractEventId(url: string | undefined): string {
  const match = url?.match(/\/event\/(\d+)\/?/);
  return match ? match[1] : "";
}

/**
 * `.event_list.vevent` 単位のイベントカード(検索結果ページ・ユーザーの参加イベント一覧ページで共通の見た目)をパースする。
 */
export function parseEventListCards(
  $: CheerioAPI,
  selector = ".event_list.vevent"
): EventListCard[] {
  const events: EventListCard[] = [];

  $(selector).each((_, element) => {
    const node = $(element);
    const titleAnchor = node.find(".event_title a").first();
    const url = titleAnchor.attr("href");
    const title = titleAnchor.text().trim();
    if (!url || !title) return;

    events.push({
      eventId: extractEventId(url),
      title,
      url,
      seriesTitle:
        node.find(".series_title").first().text().trim() || undefined,
      ownerName: node.find(".event_owner a").first().text().trim() || undefined,
      place: node.find(".event_place").first().text().trim() || undefined,
      startedAt: node.find(".dtstart .value-title").first().attr("title"),
      endedAt: node.find(".dtend .value-title").first().attr("title"),
      capacityText:
        node.find(".event_participants .amount").first().text().trim() ||
        undefined,
    });
  });

  return events;
}
