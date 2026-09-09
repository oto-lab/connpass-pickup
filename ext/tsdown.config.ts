import { defineConfig } from "tsdown";

// content script/popupとも単体のHTML/manifestから直接読み込まれる(コード分割されたチャンクを読めない)ため、
// iifeはエントリごとに分けてビルドし、依存パッケージもすべてバンドルに含める(外部化しない)。
export default defineConfig([
  {
    entry: { content: "src/content.ts" },
    format: ["iife"],
    platform: "browser",
    target: "chrome120",
    outDir: "dist",
    dts: false,
    clean: true,
    deps: { alwaysBundle: [/.*/] },
  },
  {
    entry: { popup: "src/popup.ts" },
    format: ["iife"],
    platform: "browser",
    target: "chrome120",
    outDir: "dist",
    dts: false,
    clean: false,
    deps: { alwaysBundle: [/.*/] },
  },
]);
