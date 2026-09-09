import { describe, expect, it } from "vitest";
import { buildResultHtml } from "./render-result.js";

describe("buildResultHtml", () => {
  it("イベントURLと番号付きリストを含むHTMLを生成する", () => {
    const html = buildResultHtml("385269", ["Alice", "Bob"]);
    expect(html).toContain("https://connpass.com/event/385269");
    expect(html).toContain("1. Alice");
    expect(html).toContain("2. Bob");
  });

  it("HTML特殊文字をエスケープする", () => {
    const html = buildResultHtml("1", ['<script>alert("x")</script>']);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
