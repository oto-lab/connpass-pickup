import { describe, expect, it } from "vitest";
import { getDefaultUserAgent, resolveUserAgent } from "./user-agent.js";

describe("getDefaultUserAgent", () => {
  it("空でないUA文字列を返す", () => {
    const ua = getDefaultUserAgent();
    expect(typeof ua).toBe("string");
    expect(ua.length).toBeGreaterThan(0);
  });
});

describe("resolveUserAgent", () => {
  it("オプション未指定時はデフォルトUAを返す", () => {
    expect(resolveUserAgent()).toBe(getDefaultUserAgent());
  });

  it("userAgentオプションが指定されていればそれを優先する", () => {
    expect(resolveUserAgent({ userAgent: "CustomUA/1.0" })).toBe(
      "CustomUA/1.0"
    );
  });
});
