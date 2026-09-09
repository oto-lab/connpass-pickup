#!/usr/bin/env node
// tsdown が生成した dist/content.js をもとに、Chrome/Firefox それぞれの拡張機能パッケージ(manifest + content.js + styles.css + icons)を組み立てる。
// `--zip` を付けると配布用の成果物を作る(Chromeはzip、Firefoxは web-ext 経由の xpi)。
// `--target=chrome|firefox|all`(既定: all)で対象を絞れる。

import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";
import { cmd as webExt } from "web-ext";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const srcDir = join(root, "src");

const targets = [
  { name: "chrome", manifest: "manifest.chrome.json" },
  { name: "firefox", manifest: "manifest.firefox.json" },
];

function parseTargetArg() {
  const arg = process.argv.find((a) => a.startsWith("--target="));
  const value = arg ? arg.split("=")[1] : "all";
  if (!["all", "chrome", "firefox"].includes(value)) {
    throw new Error(
      `unknown --target value: ${value} (expected chrome/firefox/all)`
    );
  }
  return value;
}

async function assembleTarget({ name, manifest }) {
  const outDir = join(distDir, name);
  await mkdir(outDir, { recursive: true });

  const manifestJson = await readFile(join(srcDir, manifest), "utf-8");
  await writeFile(join(outDir, "manifest.json"), manifestJson);

  await cp(join(distDir, "content.iife.js"), join(outDir, "content.js"));
  await cp(join(srcDir, "styles.css"), join(outDir, "styles.css"));
  await cp(join(srcDir, "icons"), join(outDir, "icons"), { recursive: true });
}

// Chrome向け: 単純なzip(archiver)。ストアへの提出・パッケージ化されていない拡張機能の読み込みどちらにも使える一般的なzip形式。
async function packageChrome() {
  const outDir = join(distDir, "chrome");
  const zipPath = join(distDir, "chrome.zip");

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(outDir, false);
    archive.finalize();
  });

  console.log(`packaged ${zipPath}`);
}

// Firefox向け: 公式ツールの web-ext でビルドする(manifestの妥当性チェックも兼ねる)。
// 出力自体はzip形式だが、AMOへの提出や about:debugging での読み込みに使う
// 拡張子として .xpi にリネームする。
async function packageFirefox() {
  const outDir = join(distDir, "firefox");
  const result = await webExt.build(
    { sourceDir: outDir, artifactsDir: distDir, overwriteDest: true },
    { shouldExitProgram: false }
  );

  const xpiPath = join(distDir, "firefox.xpi");
  await rename(result.extensionPath, xpiPath);
  console.log(`packaged ${xpiPath}`);
}

async function main() {
  const target = parseTargetArg();
  const targetsToBuild = targets.filter(
    (t) => target === "all" || target === t.name
  );

  for (const t of targetsToBuild) {
    await assembleTarget(t);
    console.log(`assembled dist/${t.name}`);
  }

  if (process.argv.includes("--zip")) {
    if (target === "all" || target === "chrome") await packageChrome();
    if (target === "all" || target === "firefox") await packageFirefox();
  }
}

main();
