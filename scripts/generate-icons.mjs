import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = readFileSync(join(publicDir, "icon.svg"), "utf8");

const sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `icon-${size}.png`));
  console.log(`  ✓ icon-${size}.png`);
}

await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, "apple-touch-icon.png"));
console.log("  ✓ apple-touch-icon.png");

console.log("\nDone!");
