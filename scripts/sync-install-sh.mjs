#!/usr/bin/env node
/**
 * Publishes the Erebrus node installer at https://erebrus.io/install.sh
 * Always fetches from the NetSepio/erebrus GitHub repo at runtime.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dest = path.join(root, "public", "install.sh");
const branch = process.env.EREBRUS_INSTALL_BRANCH || "main";
const remote = `https://raw.githubusercontent.com/NetSepio/erebrus/${branch}/install.sh`;

async function main() {
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const res = await fetch(remote);
  if (!res.ok) {
    throw new Error(`failed to fetch ${remote}: HTTP ${res.status}`);
  }

  const body = await res.text();
  if (!body.startsWith("#!/")) {
    throw new Error(`unexpected installer payload from ${remote}`);
  }

  fs.writeFileSync(dest, body, { mode: 0o755 });
  console.log(`install.sh ← ${remote}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});