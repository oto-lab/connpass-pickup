import { describe, expect, it } from "vitest";
import { buildFetchOptions } from "./http.js";

describe("buildFetchOptions", () => {
  it("既定ではUser-Agentヘッダのみを設定する", () => {
    const options = buildFetchOptions();
    expect(options).toEqual({
      headers: { "User-Agent": expect.any(String) },
    });
  });

  it("userAgentオプションを指定するとヘッダに反映される", () => {
    const options = buildFetchOptions({ userAgent: "CustomUA/1.0" });
    expect(options.headers).toEqual({ "User-Agent": "CustomUA/1.0" });
  });

  it("retry/retryDelay/timeoutを指定した場合のみ含める", () => {
    const options = buildFetchOptions({
      retry: 3,
      retryDelay: 500,
      timeout: 10_000,
    });
    expect(options.retry).toBe(3);
    expect(options.retryDelay).toBe(500);
    expect(options.timeout).toBe(10_000);
  });

  it("retry/retryDelay/timeoutを指定しなければ含まれない", () => {
    const options = buildFetchOptions();
    expect(options).not.toHaveProperty("retry");
    expect(options).not.toHaveProperty("retryDelay");
    expect(options).not.toHaveProperty("timeout");
  });

  it("proxyを指定するとdispatcherが設定される", () => {
    const options = buildFetchOptions({ proxy: "http://127.0.0.1:8080" });
    expect(options.dispatcher).toBeDefined();
  });

  it("proxyを指定しなければdispatcherは含まれない", () => {
    const options = buildFetchOptions();
    expect(options).not.toHaveProperty("dispatcher");
  });
});
