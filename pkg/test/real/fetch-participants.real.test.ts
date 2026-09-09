import { describe, expect, it } from "vitest";
import { fetchParticipants } from "../../src/participants/fetch-participants.js";

// 固定の実在イベント(385269)に対して実際にネットワークアクセスを行うテスト。
// CI や `pnpm test` からは実行されず、`pnpm run test:real` から明示的に実行する。
describe("fetchParticipants (real site)", () => {
  it("実サイトから複数の募集枠と参加者を取得できる", async () => {
    const participants = await fetchParticipants("385269");

    const roles = Object.keys(participants);
    expect(roles.length).toBeGreaterThan(0);

    const totalMembers = roles.reduce(
      (sum, role) => sum + participants[role].length,
      0
    );
    expect(totalMembers).toBeGreaterThan(0);
  });
});
