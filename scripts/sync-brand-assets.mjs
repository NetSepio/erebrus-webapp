#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.resolve(root, "../transformation");
const pub = path.join(root, "public");
const app = path.join(root, "src/app");

const copies = [
  ["exports/erebrus-favicon.ico", "public/favicon.ico"],
  ["exports/erebrus-favicon.ico", "src/app/favicon.ico"],
  ["exports/png/erebrus-mark-64.png", "public/brand/erebrus-mark.png"],
  ["exports/png/erebrus-mark-256.png", "public/brand/erebrus-mark-256.png"],
  ["exports/png/erebrus-lockup-horizontal-ondark.png", "public/brand/erebrus-lockup-horizontal.png"],
  ["exports/png/erebrus-app-icon-180.png", "public/brand/erebrus-app-icon-180.png"],
  ["exports/png/erebrus-app-icon-512.png", "public/brand/erebrus-app-icon-512.png"],
  ["exports/png/erebrus-lockup-horizontal-ondark.png", "public/brand/erebrus-og-lockup.png"],
  ["assets/erebrus-icon.png", "public/brand/erebrus-icon.png"],
  ["assets/erebrus-vpn.png", "public/brand/erebrus-vpn.png"],
  ["assets/erebrus-drop.png", "public/brand/erebrus-drop.png"],
  ["assets/erebrus-vpn-glyph.png", "public/brand/erebrus-vpn-glyph.png"],
];

fs.mkdirSync(path.join(pub, "brand"), { recursive: true });

let ok = 0;
for (const [from, to] of copies) {
  const srcPath = path.join(src, from);
  const destPath = path.join(root, to);
  if (!fs.existsSync(srcPath)) {
    console.warn(`skip (missing): ${srcPath}`);
    continue;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`copied → ${to}`);
  ok++;
}

console.log(`\n${ok}/${copies.length} brand assets synced from ${src}`);