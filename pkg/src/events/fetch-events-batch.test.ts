import { describe, expect, it, vi } from "vitest";
import type { EventDetail } from "./fetch-event.js";

const fetchEventMock = vi.fn(
  async (eventId: string, _options?: unknown): Promise<EventDetail> => ({
    eventId,
    title: `title-${eventId}`,
    url: `https://connpass.com/event/${eventId}/`,
    ptypes: [],
  })
);

vi.mock("./fetch-event.js", () => ({
  fetchEvent: (eventId: string, options?: unknown) =>
    fetchEventMock(eventId, options),
}));

const { fetchEventsBatch } = await import("./fetch-events-batch.js");

describe("fetchEventsBatch", () => {
  it("eventIdをキーにした結果マップを返す", async () => {
    const result = await fetchEventsBatch(["1", "2", "3"]);
    expect(Object.keys(result)).toEqual(["1", "2", "3"]);
    expect(result["2"].title).toBe("title-2");
  });

  it("concurrencyで指定した数以下のイベントを同時に処理する", async () => {
    let maxInFlight = 0;
    let inFlight = 0;

    fetchEventMock.mockImplementation(async (eventId: string) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight--;
      return { eventId, title: eventId, url: "", ptypes: [] };
    });

    await fetchEventsBatch(["1", "2", "3", "4"], { concurrency: 2 });
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});
