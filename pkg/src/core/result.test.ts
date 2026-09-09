import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir: string;

vi.mock("../paths.js", () => ({
  getResultsDir: () => tempDir,
}));

const openMock = vi.fn().mockResolvedValue(undefined);
vi.mock("open", () => ({ default: (...args: unknown[]) => openMock(...args) }));

const {
  buildResultMarkdown,
  renderResultHtml,
  toJson,
  toCsv,
  saveResult,
  openResult,
} = await import("./result.js");

describe("buildResultMarkdown", () => {
  it("イベントURLと番号付きリストを含むMarkdownを組み立てる", () => {
    const markdown = buildResultMarkdown("385269", ["Alice", "Bob"]);
    expect(markdown).toContain(
      "[Event URL](https://connpass.com/event/385269)"
    );
    expect(markdown).toContain("1. Alice");
    expect(markdown).toContain("2. Bob");
  });
});

describe("renderResultHtml", () => {
  it("Markdownをスタイル埋め込み済みのHTMLへ変換する", async () => {
    const markdown = buildResultMarkdown("385269", ["Alice"]);
    const html = await renderResultHtml(markdown);
    expect(html).toContain("<style>");
    expect(html).toContain("Alice");
  });
});

describe("toJson / toCsv", () => {
  it("toJsonは整形済みJSON文字列を返す", () => {
    expect(toJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("toCsvはrank,name形式のCSVを返す", () => {
    expect(toCsv(["Alice", "Bob"])).toBe("rank,name\n1,Alice\n2,Bob");
  });

  it("toCsvはカンマやダブルクォートを含む名前をエスケープする", () => {
    expect(toCsv(['A, "B"'])).toBe('rank,name\n1,"A, ""B"""');
  });
});

describe("saveResult", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "connpass-pickup-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("指定フォーマットの拡張子でファイルを保存しパスを返す", async () => {
    const filePath = await saveResult("385269", "1,Alice", "csv");
    expect(filePath.endsWith(".csv")).toBe(true);
    expect(filePath.startsWith(tempDir)).toBe(true);
    expect(await readFile(filePath, "utf-8")).toBe("1,Alice");
  });
});

describe("openResult", () => {
  it("openにファイルパスを渡す", async () => {
    await openResult("/path/to/result.html");
    expect(openMock).toHaveBeenCalledWith("/path/to/result.html", undefined);
  });

  it("optionsをopenにそのまま渡す", async () => {
    await openResult("/path/to/result.html", {
      wait: true,
      app: { name: "firefox" },
    });
    expect(openMock).toHaveBeenCalledWith("/path/to/result.html", {
      wait: true,
      app: { name: "firefox" },
    });
  });
});
