import { describe, expect, it } from "vitest";
import { fetchUserProfile } from "../../src/users/fetch-user.js";

// connpass 開発者本人の公開プロフィール。今後も存在し続けることが見込めるため実サイトテストの固定ユーザーとして使用する。
const NICKNAME = "haru860";

describe("fetchUserProfile (real site)", () => {
  it("実サイトから表示名を取得できる", async () => {
    const profile = await fetchUserProfile(NICKNAME);
    expect(profile.displayName?.length ?? 0).toBeGreaterThan(0);
  });
});
