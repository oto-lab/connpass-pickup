import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import prettier from "prettier";
import open, { type Options as OpenOptions } from "open";
import { getResultsDir } from "../paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ビルド後(dist/index.mjs はパッケージ直下)は "../assets"、
// 開発時(このファイルは src/core/result.ts)は "../../assets" になる。
// バンドラーによる階層変化に依存しないよう、実在するほうを採用する。
function resolveAssetsDir(): string {
  const candidates = [
    join(__dirname, "..", "assets"),
    join(__dirname, "..", "..", "assets"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

const ASSETS_DIR = resolveAssetsDir();

export type ResultFormat = "html" | "markdown" | "json" | "csv";

const EXTENSION_BY_FORMAT: Record<ResultFormat, string> = {
  html: "html",
  markdown: "md",
  json: "json",
  csv: "csv",
};

/**
 * シャッフル結果(並び順つきメンバー一覧)から Markdown 本文を組み立てる。
 */
export function buildResultMarkdown(
  eventId: string,
  members: string[]
): string {
  let markdown = `# 順番 \n[Event URL](https://connpass.com/event/${eventId})`;
  members.forEach((member, index) => {
    markdown += `\n${index + 1}. ${member}`;
  });
  return markdown;
}

/**
 * Markdown 本文を、同梱の `assets/index.html` + `assets/style.css` に埋め込んだ完成形の HTML 文字列に変換する。
 */
export async function renderResultHtml(markdown: string): Promise<string> {
  const md = new MarkdownIt();
  const htmlFragment = md.render(markdown);

  const style = await readFile(join(ASSETS_DIR, "style.css"), "utf-8");
  const template = await readFile(join(ASSETS_DIR, "index.html"), "utf-8");

  const html = template
    .replace("<style></style>", `<style>${style}</style>`)
    .replace("<main></main>", `<main>${htmlFragment}</main>`);

  return prettier.format(html, { parser: "html" });
}

/**
 * 任意のデータを整形済み JSON 文字列にする。
 */
export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// RFC4180 に沿った最小限の CSV エスケープ(外部CSVライブラリは使わない)。
function escapeCsvField(field: string): string {
  if (/[",\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * 並び順つきメンバー一覧を `rank,name` 形式の CSV 文字列にする。
 */
export function toCsv(members: string[]): string {
  const header = "rank,name";
  const rows = members.map(
    (member, index) => `${index + 1},${escapeCsvField(member)}`
  );
  return [header, ...rows].join("\n");
}

/**
 * 結果を OS 標準のユーザーデータディレクトリ配下に保存し、保存先のパスを返す。
 * `format` に応じて拡張子を切り替える(HTML/Markdown/JSON/CSV 共通の保存処理)。
 */
export async function saveResult(
  eventId: string,
  content: string,
  format: ResultFormat
): Promise<string> {
  const outputDir = getResultsDir();
  await mkdir(outputDir, { recursive: true });

  const extension = EXTENSION_BY_FORMAT[format];
  const filePath = join(outputDir, `${eventId}_${Date.now()}.${extension}`);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

export type { OpenOptions };

/**
 * 保存済みの結果ファイルを既定のブラウザ/アプリで開く。
 * CLI だけでなくプログラムからも同じ体験を再現できるよう公開している。
 * `options` はそのまま [open](https://github.com/sindresorhus/open) に渡される
 * (`wait`: 起動したアプリの終了を待つ、`app`: 開くアプリを指定する、など)。
 */
export async function openResult(
  filePath: string,
  options?: OpenOptions
): Promise<void> {
  await open(filePath, options);
}
