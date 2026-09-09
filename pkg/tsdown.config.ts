import { defineConfig } from "tsdown";

// open は ESM 専用パッケージ(CJS の require では読み込めない)なので、
// 実行時に依存解決させず、ビルド時に静的バンドルして両出力に埋め込む。
const deps = { alwaysBundle: ["open"] };

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "node22",
    platform: "node",
    deps,
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: false,
    target: "node22",
    platform: "node",
    deps,
  },
]);
