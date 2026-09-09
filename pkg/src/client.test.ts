import { describe, expect, it, vi } from "vitest";

const fetchParticipantsMock = vi.fn().mockResolvedValue({});
const fetchParticipantsDetailedMock = vi
  .fn()
  .mockResolvedValue({ participants: {}, roles: [] });
vi.mock("./participants/fetch-participants.js", () => ({
  fetchParticipants: (...args: unknown[]) => fetchParticipantsMock(...args),
  fetchParticipantsDetailed: (...args: unknown[]) =>
    fetchParticipantsDetailedMock(...args),
}));

const fetchEventMock = vi.fn().mockResolvedValue({});
vi.mock("./events/fetch-event.js", () => ({
  fetchEvent: (...args: unknown[]) => fetchEventMock(...args),
}));

const fetchEventsBatchMock = vi.fn().mockResolvedValue({});
vi.mock("./events/fetch-events-batch.js", () => ({
  fetchEventsBatch: (...args: unknown[]) => fetchEventsBatchMock(...args),
}));

const searchEventsMock = vi.fn().mockResolvedValue([]);
const searchAllEventsMock = vi.fn().mockResolvedValue([]);
vi.mock("./events/search-events.js", () => ({
  searchEvents: (...args: unknown[]) => searchEventsMock(...args),
  searchAllEvents: (...args: unknown[]) => searchAllEventsMock(...args),
}));

const fetchGroupEventsMock = vi.fn().mockResolvedValue([]);
vi.mock("./events/fetch-group-events.js", () => ({
  fetchGroupEvents: (...args: unknown[]) => fetchGroupEventsMock(...args),
}));

const fetchUserProfileMock = vi.fn().mockResolvedValue({});
const fetchUserEventsMock = vi.fn().mockResolvedValue([]);
vi.mock("./users/fetch-user.js", () => ({
  fetchUserProfile: (...args: unknown[]) => fetchUserProfileMock(...args),
  fetchUserEvents: (...args: unknown[]) => fetchUserEventsMock(...args),
}));

const { ConnpassClient } = await import("./client.js");

describe("ConnpassClient", () => {
  it("コンストラクタのオプションを各メソッド呼び出しに引き継ぐ", async () => {
    const client = new ConnpassClient({ userAgent: "ClientUA/1.0", retry: 2 });

    await client.fetchParticipants("385269");
    expect(fetchParticipantsMock).toHaveBeenCalledWith("385269", {
      userAgent: "ClientUA/1.0",
      retry: 2,
    });

    await client.fetchEvent("385269");
    expect(fetchEventMock).toHaveBeenCalledWith("385269", {
      userAgent: "ClientUA/1.0",
      retry: 2,
    });

    await client.fetchGroupEvents("smarthr");
    expect(fetchGroupEventsMock).toHaveBeenCalledWith("smarthr", {
      userAgent: "ClientUA/1.0",
      retry: 2,
    });

    await client.fetchUserProfile("haru860");
    expect(fetchUserProfileMock).toHaveBeenCalledWith("haru860", {
      userAgent: "ClientUA/1.0",
      retry: 2,
    });
  });

  it("呼び出し時のオプションがコンストラクタの既定値より優先される", async () => {
    const client = new ConnpassClient({ userAgent: "ClientUA/1.0", retry: 2 });

    await client.fetchEvent("385269", { retry: 5 });
    expect(fetchEventMock).toHaveBeenCalledWith("385269", {
      userAgent: "ClientUA/1.0",
      retry: 5,
    });
  });

  it("searchEventsではparamsと既定値を1つのオブジェクトにまとめて渡す", async () => {
    const client = new ConnpassClient({ userAgent: "ClientUA/1.0" });

    await client.searchEvents({ keyword: "Python" });
    expect(searchEventsMock).toHaveBeenCalledWith({
      userAgent: "ClientUA/1.0",
      keyword: "Python",
    });
  });

  it("searchAllEventsではparamsに既定値を、optionsはそのまま渡す", async () => {
    const client = new ConnpassClient({ userAgent: "ClientUA/1.0" });

    await client.searchAllEvents({ keyword: "Python" }, { maxPages: 3 });
    expect(searchAllEventsMock).toHaveBeenCalledWith(
      { userAgent: "ClientUA/1.0", keyword: "Python" },
      { maxPages: 3 }
    );
  });

  it("fetchEventsBatchにconcurrencyなどの既定値を引き継ぐ", async () => {
    const client = new ConnpassClient({ concurrency: 5 });

    await client.fetchEventsBatch(["1", "2"]);
    expect(fetchEventsBatchMock).toHaveBeenCalledWith(["1", "2"], {
      concurrency: 5,
    });
  });

  it("shuffle/buildResultMarkdown/toJson/toCsvなどのユーティリティも呼び出せる", () => {
    const client = new ConnpassClient();

    const shuffled = client.shuffle(["a", "b", "c"]);
    expect([...shuffled].sort()).toEqual(["a", "b", "c"]);

    const markdown = client.buildResultMarkdown("385269", ["Alice"]);
    expect(markdown).toContain("Alice");

    expect(client.toJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(client.toCsv(["Alice"])).toBe("rank,name\n1,Alice");
  });
});
