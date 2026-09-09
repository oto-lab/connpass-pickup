import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseIcsEvent } from "./parse-ics.js";

const fixtureIcs = await readFile(
  join(import.meta.dirname, "..", "..", "test", "fixtures", "event.sample.ics"),
  "utf-8"
);

describe("parseIcsEvent", () => {
  it("SUMMARY/LOCATION/URLを読み取る", () => {
    const event = parseIcsEvent(fixtureIcs);
    expect(event.summary).toBe("サンプルイベント");
    expect(event.location).toBe("北海道函館市駒場町14 (駒場車庫前)");
    expect(event.url).toBe("https://smarthr.connpass.com/event/385269/");
  });

  it("DTSTART/DTENDをUTCのDateへ変換する", () => {
    const event = parseIcsEvent(fixtureIcs);
    expect(event.startedAt?.toISOString()).toBe("2026-04-25T00:30:00.000Z");
    expect(event.endedAt?.toISOString()).toBe("2026-04-25T03:00:00.000Z");
  });

  it("バックスラッシュエスケープを元に戻す", () => {
    const event = parseIcsEvent(fixtureIcs);
    expect(event.description).toBe(
      "テスト用の説明文です\n改行と, カンマ; セミコロンを含みます"
    );
  });

  it("必要な行が無ければ該当フィールドはundefinedになる", () => {
    const event = parseIcsEvent("BEGIN:VCALENDAR\nEND:VCALENDAR\n");
    expect(event.summary).toBeUndefined();
    expect(event.startedAt).toBeUndefined();
  });
});
