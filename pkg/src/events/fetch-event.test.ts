import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const fixturesDir = join(import.meta.dirname, "..", "..", "test", "fixtures");
const eventHtml = await readFile(
  join(fixturesDir, "event.sample.html"),
  "utf-8"
);
const eventIcs = await readFile(join(fixturesDir, "event.sample.ics"), "utf-8");

vi.mock("ofetch", () => ({
  ofetch: vi.fn((url: string) =>
    url.endsWith(".ics")
      ? Promise.resolve(eventIcs)
      : Promise.resolve(eventHtml)
  ),
}));

const { fetchEvent } = await import("./fetch-event.js");

describe("fetchEvent", () => {
  it("タイトル・主催者・会場をHTMLから取得する", async () => {
    const event = await fetchEvent("385269");
    expect(event.title).toBe("サンプルイベント");
    expect(event.subtitle).toBe("サブタイトルです");
    expect(event.ownerName).toBe("株式会社サンプル");
    expect(event.placeName).toBe("駒場車庫前");
    expect(event.address).toBe("北海道函館市駒場町14");
    expect(event.latitude).toBeCloseTo(41.7830445);
    expect(event.longitude).toBeCloseTo(140.7781007);
  });

  it("日時はicsファイルから取得する", async () => {
    const event = await fetchEvent("385269");
    expect(event.startedAt?.toISOString()).toBe("2026-04-25T00:30:00.000Z");
    expect(event.endedAt?.toISOString()).toBe("2026-04-25T03:00:00.000Z");
  });

  it("募集枠ごとの定員情報を取得する", async () => {
    const event = await fetchEvent("385269");
    expect(event.ptypes).toEqual([
      {
        name: "General Attendees / 参加枠",
        fee: "無料",
        capacityText: "13/12",
      },
      {
        name: "Lightning Talk applicants / LT登壇枠",
        fee: "無料",
        capacityText: "5/15",
      },
    ]);
  });
});
