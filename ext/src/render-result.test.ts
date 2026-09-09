import { describe, expect, it } from "vitest";
import { buildResultHtml } from "./render-result.js";

describe("buildResultHtml", () => {
  it("イベントURLと番号付きリスト(ol)を含むHTMLを生成する", () => {
    const html = buildResultHtml("385269", ["Alice", "Bob"]);
    expect(html).toContain("https://connpass.com/event/385269");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Alice</li>");
    expect(html).toContain("<li>Bob</li>");
  });

  it("HTML特殊文字をエスケープする", () => {
    const html = buildResultHtml("1", ['<script>alert("x")</script>']);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
