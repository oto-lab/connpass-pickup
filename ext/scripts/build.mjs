#!/usr/bin/env node
// tsdown が生成した dist/content.js をもとに、Chrome/Firefox それぞれの拡張機能パッケージ(manifest + content.js + styles.css + icons)を組み立てる。
// `--zip` を付けると各ディレクトリを zip 化する(リリース成果物向け)。

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const srcDir = join(root, "src");

const targets = [
  { name: "chrome", manifest: "manifest.chrome.json" },
  { name: "firefox", manifest: "manifest.firefox.json" },
];

async function assembleTarget({ name, manifest }) {
  const outDir = join(distDir, name);
  await mkdir(outDir, { recursive: true });

  const manifestJson = await readFile(join(srcDir, manifest), "utf-8");
  await writeFile(join(outDir, "manifest.json"), manifestJson);

  await cp(join(distDir, "content.iife.js"), join(outDir, "content.js"));
  await cp(join(srcDir, "styles.css"), join(outDir, "styles.css"));
  await cp(join(srcDir, "icons"), join(outDir, "icons"), { recursive: true });
}

async function zipTarget(name) {
  const outDir = join(distDir, name);
  const zipPath = join(distDir, `${name}.zip`);

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

async function main() {
  for (const target of targets) {
    await assembleTarget(target);
    console.log(`assembled dist/${target.name}`);
  }

  if (process.argv.includes("--zip")) {
    for (const target of targets) {
      await zipTarget(target.name);
    }
  }
}

main();
