import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getResultsDir } from "./paths.js";

describe("getResultsDir", () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    process.env = { ...originalEnv };
  });

  function setPlatform(platform: NodeJS.Platform) {
    Object.defineProperty(process, "platform", { value: platform });
  }

  it("Windowsでは %APPDATA%/connpass-pickup/results を返す", () => {
    setPlatform("win32");
    process.env.APPDATA = "C:\\Users\\test\\AppData\\Roaming";
    expect(getResultsDir()).toBe(
      "C:\\Users\\test\\AppData\\Roaming\\connpass-pickup\\results"
    );
  });

  it("macOSでは ~/Library/Application Support/connpass-pickup/results を返す", () => {
    setPlatform("darwin");
    expect(getResultsDir()).toMatch(
      /Library[/\\]Application Support[/\\]connpass-pickup[/\\]results$/
    );
  });

  it("Linuxでは XDG_DATA_HOME を優先して使う", () => {
    setPlatform("linux");
    process.env.XDG_DATA_HOME = "/home/test/.data";
    expect(getResultsDir()).toBe("/home/test/.data/connpass-pickup/results");
  });

  it("Linuxで XDG_DATA_HOME 未設定時は ~/.local/share にフォールバックする", () => {
    setPlatform("linux");
    delete process.env.XDG_DATA_HOME;
    expect(getResultsDir()).toMatch(
      /\.local[/\\]share[/\\]connpass-pickup[/\\]results$/
    );
  });
});
