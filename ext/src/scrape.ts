/** 募集枠名をキー、参加者の表示名一覧を値とするマップ */
export type Participants = Record<string, string[]>;

function extractDisplayName(anchor: HTMLAnchorElement): string {
  const name = anchor.textContent?.trim() ?? "";
  const href = anchor.getAttribute("href") ?? "";
  const match = href.match(/user\/([^/]+)/);
  const username = match ? match[1] : "";
  return `${name} (${username})`;
}

/**
 * connpass の参加者ページ(Document)から募集枠ごとの参加者一覧を抽出する。
 * pkg 側の同名ロジックとは独立した実装(拡張機能はDOMを直接読む)。
 */
export function scrapeParticipants(doc: Document): Participants {
  const participants: Participants = {};

  const adminTable = doc.querySelector(".concerned_area .participants_table");
  if (adminTable) {
    const adminNames: string[] = [];
    adminTable
      .querySelectorAll<HTMLAnchorElement>("tbody .user .display_name a")
      .forEach((anchor) => adminNames.push(extractDisplayName(anchor)));
    if (adminNames.length > 0) {
      participants["☆管理者"] = adminNames;
    }
  }

  doc.querySelectorAll(".participation_table_area").forEach((section) => {
    const roleNameElement = section.querySelector("thead .label_ptype_name");
    if (!roleNameElement) return;

    const roleName = roleNameElement.textContent?.trim() ?? "";
    if (!roleName) return;

    const names: string[] = [];
    section
      .querySelectorAll<HTMLAnchorElement>("tbody .user .display_name a")
      .forEach((anchor) => names.push(extractDisplayName(anchor)));

    if (names.length > 0) {
      participants[roleName] = names;
    }
  });

  return participants;
}
