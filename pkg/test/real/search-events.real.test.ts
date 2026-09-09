import { describe, expect, it } from "vitest";
import { searchEvents } from "../../src/events/search-events.js";

describe("searchEvents (real site)", () => {
  it("実サイトでキーワード検索すると1件以上のイベントが返る", async () => {
    const events = await searchEvents({ keyword: "connpass" });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventId.length).toBeGreaterThan(0);
  });
});
