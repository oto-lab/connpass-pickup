import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { content: "src/content.ts" },
  format: ["iife"],
  platform: "browser",
  target: "chrome120",
  outDir: "dist",
  dts: false,
  clean: true,
  // 拡張機能のcontent scriptは単体で読み込まれるため、依存パッケージもすべてバンドルに含める(外部化しない)。
  deps: { alwaysBundle: [/.*/] },
});
