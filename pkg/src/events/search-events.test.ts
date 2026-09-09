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
    "search.sample.html"
  ),
  "utf-8"
);

const ofetchMock = vi.fn().mockResolvedValue(fixtureHtml);
vi.mock("ofetch", () => ({
  ofetch: (...args: unknown[]) => ofetchMock(...args),
}));

const { searchEvents, searchAllEvents } = await import("./search-events.js");

describe("searchEvents", () => {
  it("検索結果ページから件名・URL・eventIdを取得する", async () => {
    const events = await searchEvents({ keyword: "サンプル" });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      eventId: "385269",
      title: "サンプルイベント",
      url: "https://smarthr.connpass.com/event/385269/",
      seriesTitle: "SmartHR",
      ownerName: "サンプル 主催者",
    });
    expect(events[1]).toMatchObject({
      eventId: "999999",
      title: "別のイベント",
    });
  });

  it("keyword等のパラメータをクエリとして渡す", async () => {
    await searchEvents({ keyword: "Python", page: 2, sort: "2" });
    expect(ofetchMock).toHaveBeenCalledWith(
      "https://connpass.com/search/",
      expect.objectContaining({
        query: expect.objectContaining({ q: "Python", page: 2, sort: "2" }),
      })
    );
  });

  it("keyword等の絞り込み条件が1つも無い場合はエラーを投げる", async () => {
    await expect(searchEvents({})).rejects.toThrow(
      /keyword\/dateFrom\/dateTo\/prefectures/
    );
  });

  it("prefecturesだけの指定でも(keyword無しでも)検索できる", async () => {
    await expect(
      searchEvents({ prefectures: ["online"] })
    ).resolves.not.toThrow();
  });
});

describe("searchAllEvents", () => {
  it("結果が空になるまでpageを進めて全件まとめて返す", async () => {
    let callCount = 0;
    ofetchMock.mockImplementation(async () => {
      callCount++;
      return callCount <= 2 ? fixtureHtml : "<html><body></body></html>";
    });

    const events = await searchAllEvents({ keyword: "サンプル" });

    expect(callCount).toBe(3);
    expect(events).toHaveLength(4); // 2件 x 2ページ分
  });

  it("maxPagesで取得ページ数の上限を制御できる", async () => {
    ofetchMock.mockResolvedValue(fixtureHtml);

    const events = await searchAllEvents(
      { keyword: "サンプル" },
      { maxPages: 1 }
    );

    expect(events).toHaveLength(2);
  });
});
