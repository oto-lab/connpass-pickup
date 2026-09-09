import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const fixtureHtml = await readFile(
  join(
    import.meta.dirname,
    "..",
    "..",
    "test",
    "fixtures",
    "group.sample.html"
  ),
  "utf-8"
);

const ofetchMock = vi.fn().mockResolvedValue(fixtureHtml);
vi.mock("ofetch", () => ({
  ofetch: (...args: unknown[]) => ofetchMock(...args),
}));

const { fetchGroupEvents } = await import("./fetch-group-events.js");

describe("fetchGroupEvents", () => {
  it("グループのサブドメインからイベント一覧を取得する", async () => {
    const events = await fetchGroupEvents("smarthr");

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventId: "404833",
      title: "サンプル勉強会",
      ownerName: "サンプル 主催者",
      capacityText: "37/60",
    });
  });

  it("サブドメインからURLを組み立ててアクセスする", async () => {
    await fetchGroupEvents("smarthr");
    expect(ofetchMock).toHaveBeenCalledWith(
      "https://smarthr.connpass.com/",
      expect.any(Object)
    );
  });
});
