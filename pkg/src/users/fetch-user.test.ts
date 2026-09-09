import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const fixtureHtml = await readFile(
  join(import.meta.dirname, "..", "..", "test", "fixtures", "user.sample.html"),
  "utf-8"
);

vi.mock("ofetch", () => ({ ofetch: vi.fn().mockResolvedValue(fixtureHtml) }));

const { fetchUserProfile, fetchUserEvents } = await import("./fetch-user.js");

describe("fetchUserProfile", () => {
  it("表示名・自己紹介・SNSリンク・利用開始日を取得する", async () => {
    const profile = await fetchUserProfile("sample_taro");

    expect(profile).toMatchObject({
      nickname: "sample_taro",
      displayName: "サンプル 太郎",
      bio: "サンプル用の自己紹介文です。",
      joinedAt: "2020/01/01",
      twitterUrl: "https://x.com/intent/user?user_id=1",
      githubUrl: "https://github.com/sample_taro",
    });
  });
});

describe("fetchUserEvents", () => {
  it("参加登録済みイベント一覧を取得する", async () => {
    const events = await fetchUserEvents("sample_taro");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventId: "385269",
      title: "サンプルイベント",
    });
  });
});
