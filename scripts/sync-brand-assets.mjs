#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const transformation = path.resolve(root, "../transformation");
const pub = path.join(root, "public");

const HOSTED_LOGO_SIZE = 1024;

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

/** Public product logos — https://erebrus.io/{drop|vpn}/logo.png */
const hostedLogos = [
  {
    slug: "drop",
    sources: ["uploads/erebrus_drop_logo.png", "assets/erebrus-drop.png", "public/brand/erebrus-drop.png"],
    dest: "public/drop/logo.png",
  },
  {
    slug: "vpn",
    sources: [
      "uploads/erebrus-vpn-icon-1024.png",
      "assets/erebrus-vpn.png",
      "public/brand/erebrus-vpn.png",
    ],
    dest: "public/vpn/logo.png",
  },
];

function firstExisting(paths) {
  for (const rel of paths) {
    const abs = path.isAbsolute(rel) ? rel : path.join(transformation, rel);
    const fallback = rel.startsWith("public/") ? path.join(root, rel) : abs;
    const candidate = fs.existsSync(abs) ? abs : fallback;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function exportHostedLogo({ slug, sources, dest }) {
  const srcPath = firstExisting(sources);
  const destPath = path.join(root, dest);

  if (!srcPath) {
    console.warn(`skip hosted logo (missing source): ${slug}`);
    return false;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  await sharp(srcPath)
    .resize(HOSTED_LOGO_SIZE, HOSTED_LOGO_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toFile(destPath);

  console.log(`hosted logo → ${dest} (${HOSTED_LOGO_SIZE}×${HOSTED_LOGO_SIZE} from ${path.basename(srcPath)})`);
  return true;
}

fs.mkdirSync(path.join(pub, "brand"), { recursive: true });

let ok = 0;
for (const [from, to] of copies) {
  const srcPath = path.join(transformation, from);
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

let hosted = 0;
for (const spec of hostedLogos) {
  if (await exportHostedLogo(spec)) hosted++;
}

console.log(`\n${ok}/${copies.length} brand assets synced from ${transformation}`);
console.log(`${hosted}/${hostedLogos.length} hosted product logos at /drop/logo.png and /vpn/logo.png`);