// Precompute a dot-matrix world map for the canvas globe.
// Samples a lat/lng grid, keeps points that fall on land (per src/data/globe.json),
// and writes them to src/data/land-dots.json as compact [lat, lng] pairs.
//
// Run: node scripts/gen-land-dots.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoContains } from "d3-geo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const world = JSON.parse(readFileSync(join(root, "src/data/globe.json"), "utf8"));

// Even-ish spacing on the sphere: hold the latitude step fixed and widen the
// longitude step toward the poles by 1/cos(lat) so dots don't bunch up.
const LAT_STEP = 1.7;
const LAT_MIN = -58; // include southern tips, skip deep Antarctica
const LAT_MAX = 80;

const dots = [];
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += LAT_STEP) {
  const lngStep = LAT_STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.22);
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (geoContains(world, [lng, lat])) {
      dots.push([Math.round(lat * 10) / 10, Math.round(lng * 10) / 10]);
    }
  }
}

writeFileSync(join(root, "src/data/land-dots.json"), JSON.stringify(dots));
console.log(`land-dots.json → ${dots.length} points`);
