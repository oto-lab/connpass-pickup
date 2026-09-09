import { describe, expect, it } from "vitest";
import { fetchEvent } from "../../src/events/fetch-event.js";

describe("fetchEvent (real site)", () => {
  it("実サイトからタイトルと開催日時を取得できる", async () => {
    const event = await fetchEvent("385269");

    expect(event.title.length).toBeGreaterThan(0);
    expect(event.startedAt).toBeInstanceOf(Date);
    expect(event.endedAt).toBeInstanceOf(Date);
  });
});
