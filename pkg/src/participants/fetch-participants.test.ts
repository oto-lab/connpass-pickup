import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const fixturesDir = join(import.meta.dirname, "..", "..", "test", "fixtures");
const fixtureHtml = await readFile(
  join(fixturesDir, "participation.sample.html"),
  "utf-8"
);
const ptypePage1Html = await readFile(
  join(fixturesDir, "ptype-page1.sample.html"),
  "utf-8"
);
const ptypePage2Html = await readFile(
  join(fixturesDir, "ptype-page2.sample.html"),
  "utf-8"
);

const PTYPE_URL =
  "https://smarthr.connpass.com/event/385269/ptype/999999/participants/";

const ofetchMock = vi.fn((url: string, _options?: unknown) => {
  if (url === PTYPE_URL) return Promise.resolve(ptypePage1Html);
  if (url === `${PTYPE_URL}?page=2`) return Promise.resolve(ptypePage2Html);
  return Promise.resolve(fixtureHtml);
});

vi.mock("ofetch", () => ({
  ofetch: (...args: [string, unknown]) => ofetchMock(...args),
}));

const { fetchParticipants, fetchParticipantsDetailed } =
  await import("./fetch-participants.js");

// テストではページネーション間の待機時間(既定300ms)を挟まないようにする。
const NO_DELAY = { requestDelay: 0 };

describe("fetchParticipants", () => {
  it("募集枠ごとに参加者の表示名一覧を取得する", async () => {
    const participants = await fetchParticipants("385269", NO_DELAY);

    expect(participants["☆管理者"]).toEqual(["管理 太郎 (admin_taro)"]);
    expect(participants["General Attendees / 参加枠"]).toEqual([
      "Alice (alice)",
      "Bob (bob)",
    ]);
    expect(participants["Lightning Talk applicants / LT登壇枠"]).toEqual([
      "Carol (carol)",
    ]);
  });

  it("参加者がいない枠は結果に含めない", async () => {
    const participants = await fetchParticipants("385269", NO_DELAY);
    expect(participants["空の枠 / Empty"]).toBeUndefined();
  });

  it("event IDから参加者ページのURLを組み立ててアクセスする", async () => {
    await fetchParticipants("385269", NO_DELAY);
    expect(ofetchMock).toHaveBeenCalledWith(
      "https://connpass.com/event/385269/participation/",
      expect.objectContaining({
        headers: expect.objectContaining({ "User-Agent": expect.any(String) }),
      })
    );
  });

  it("userAgentオプションを指定するとそれがヘッダに使われる", async () => {
    await fetchParticipants("385269", {
      userAgent: "CustomUA/1.0",
      ...NO_DELAY,
    });
    expect(ofetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { "User-Agent": "CustomUA/1.0" } })
    );
  });

  it("「もっと見る」リンクがある枠はページネーションを辿って全件取得する", async () => {
    const participants = await fetchParticipants("385269", NO_DELAY);
    expect(participants["Overflow / 満員枠"]).toEqual([
      "Dave (dave)",
      "Erin (erin)",
      "Frank (frank)",
    ]);
  });

  it("fetchAllPages: falseを指定すると先頭ページの参加者だけを返す", async () => {
    const participants = await fetchParticipants("385269", {
      fetchAllPages: false,
    });
    expect(participants["Overflow / 満員枠"]).toEqual(["Dave (dave)"]);
  });
});

describe("fetchParticipantsDetailed", () => {
  it("枠ごとの取得件数・全体人数・切り詰めの有無を返す", async () => {
    const { roles } = await fetchParticipantsDetailed("385269", NO_DELAY);

    expect(roles).toContainEqual({
      role: "☆管理者",
      fetchedCount: 1,
      totalCount: 1,
      truncated: false,
    });
    expect(roles).toContainEqual({
      role: "General Attendees / 参加枠",
      fetchedCount: 2,
      totalCount: 2,
      truncated: false,
    });
  });

  it("「もっと見る」の無い枠で表示上限を超える場合はtruncated: trueになる", async () => {
    const { roles } = await fetchParticipantsDetailed("385269", NO_DELAY);
    const ltRole = roles.find(
      (role) => role.role === "Lightning Talk applicants / LT登壇枠"
    );

    expect(ltRole).toEqual({
      role: "Lightning Talk applicants / LT登壇枠",
      fetchedCount: 1,
      totalCount: 150,
      truncated: true,
    });
  });

  it("「もっと見る」を辿って全件取得できた場合はtruncated: falseになる", async () => {
    const { roles } = await fetchParticipantsDetailed("385269", NO_DELAY);
    const overflowRole = roles.find(
      (role) => role.role === "Overflow / 満員枠"
    );

    expect(overflowRole).toEqual({
      role: "Overflow / 満員枠",
      fetchedCount: 3,
      totalCount: 3,
      truncated: false,
    });
  });

  it("maxPagesPerRoleに達しても次ページが残る場合はtruncated: trueになる", async () => {
    const { roles } = await fetchParticipantsDetailed("385269", {
      maxPagesPerRole: 1,
      ...NO_DELAY,
    });
    const overflowRole = roles.find(
      (role) => role.role === "Overflow / 満員枠"
    );

    expect(overflowRole?.fetchedCount).toBe(2);
    expect(overflowRole?.truncated).toBe(true);
  });

  it("requestDelayを指定するとページ間で待機する", async () => {
    vi.useFakeTimers();
    try {
      const promise = fetchParticipantsDetailed("385269", {
        requestDelay: 500,
      });
      // 1ページ目の取得とパース、待機開始までマイクロタスクを進める
      await vi.advanceTimersByTimeAsync(0);
      // 500ms未満ではまだ2ページ目に進んでいないはず
      await vi.advanceTimersByTimeAsync(400);
      expect(ofetchMock).not.toHaveBeenCalledWith(
        `${PTYPE_URL}?page=2`,
        expect.anything()
      );
      // 残りの待機時間を進めると2ページ目が取得される
      await vi.advanceTimersByTimeAsync(200);
      await promise;
      expect(ofetchMock).toHaveBeenCalledWith(
        `${PTYPE_URL}?page=2`,
        expect.anything()
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
