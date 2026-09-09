import browser from "webextension-polyfill";
import { scrapeParticipants, type Participants } from "./scrape.js";

export interface ScrapeRequestMessage {
  type: "connpass-pickup/scrape";
}

export interface ScrapeResponseMessage {
  eventId: string;
  participants: Participants;
}

function extractEventIdFromLocation(): string {
  const match = location.pathname.match(/\/event\/(\d+)\//);
  return match ? match[1] : "";
}

function isScrapeRequest(message: unknown): message is ScrapeRequestMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as Record<string, unknown>).type === "connpass-pickup/scrape"
  );
}

// ポップアップは開くたびにこのリスナー経由で最新のDOMを問い合わせるため、
// ページ内にUIを常駐させる必要がなく、参加者一覧が動的に更新されても再読み込み不要で追従できる。
browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isScrapeRequest(message)) return undefined;

  const response: ScrapeResponseMessage = {
    eventId: extractEventIdFromLocation(),
    participants: scrapeParticipants(document),
  };
  return Promise.resolve(response);
});
