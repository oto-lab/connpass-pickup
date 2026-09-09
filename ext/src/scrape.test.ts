import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scrapeParticipants } from "./scrape.js";

const fixtureHtml = await readFile(
  join(
    import.meta.dirname,
    "..",
    "test",
    "fixtures",
    "participation.sample.html"
  ),
  "utf-8"
);

function parseDocument(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("scrapeParticipants", () => {
  it("募集枠ごとに参加者の表示名一覧を取得する", () => {
    const doc = parseDocument(fixtureHtml);
    const participants = scrapeParticipants(doc);

    expect(participants["☆管理者"]).toEqual(["管理 太郎 (admin_taro)"]);
    expect(participants["General Attendees / 参加枠"]).toEqual([
      "Alice (alice)",
      "Bob (bob)",
    ]);
    expect(participants["Lightning Talk applicants / LT登壇枠"]).toEqual([
      "Carol (carol)",
    ]);
  });

  it("参加者がいない枠は結果に含めない", () => {
    const doc = parseDocument(fixtureHtml);
    const participants = scrapeParticipants(doc);
    expect(participants["空の枠 / Empty"]).toBeUndefined();
  });
});
