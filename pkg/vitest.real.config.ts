import { defineConfig } from "vitest/config";

// 実サイト(connpass.com)に実際にアクセスするテスト専用の設定。
// CI や `pnpm test` からは実行されず、`pnpm run test:real` からのみ呼び出す。
export default defineConfig({
  test: {
    include: ["test/real/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
