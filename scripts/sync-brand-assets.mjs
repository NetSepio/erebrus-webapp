#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "public", "brand");

/** Public product logos — https://erebrus.io/{drop|vpn|ai}/logo.png
 *
 *  Source of truth for brand assets is public/brand. No external folders
 *  are referenced, so the repo is self-contained for local dev and CI/CD.
 */
const hostedLogos = [
  { slug: "drop", source: "erebrus-drop.png", dest: "public/drop/logo.png" },
  { slug: "vpn", source: "erebrus-vpn.png", dest: "public/vpn/logo.png" },
  { slug: "ai", source: "erebrus-ai.png", dest: "public/ai/logo.png" },
];

function isNewerThan(a, b) {
  if (!fs.existsSync(a)) return false;
  if (!fs.existsSync(b)) return true;
  return fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs;
}

function exportHostedLogo({ slug, source, dest }) {
  const srcPath = path.join(brandDir, source);
  const destPath = path.join(root, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`skip hosted logo (missing brand source): ${slug} -> ${source}`);
    return false;
  }

  if (!isNewerThan(srcPath, destPath)) {
    console.log(`up-to-date: ${dest}`);
    return true;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`hosted logo → ${dest} (from brand/${source})`);
  return true;
}

fs.mkdirSync(brandDir, { recursive: true });

let hosted = 0;
for (const spec of hostedLogos) {
  if (exportHostedLogo(spec)) hosted++;
}

console.log(`\n${hosted}/${hostedLogos.length} hosted product logos copied from public/brand`);