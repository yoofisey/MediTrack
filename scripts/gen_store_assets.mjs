import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "store");
fs.mkdirSync(outDir, { recursive: true });

const iconSvg = fs.readFileSync(path.join(root, "public", "icon.svg"), "utf8");
const squareSvg = iconSvg.replace('rx="112"', 'rx="0"');

async function renderSvg(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

await sharp(Buffer.from(squareSvg)).resize(512, 512).png().toFile(path.join(outDir, "icon-512.png"));
await sharp(Buffer.from(squareSvg)).resize(1024, 1024).png().toFile(path.join(outDir, "icon-1024.png"));

const featureGraphicSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#5856D6"/>
    </linearGradient>
    <linearGradient id="glyph" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#5856D6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#fg)"/>
  <circle cx="900" cy="40" r="170" fill="none" stroke="white" stroke-opacity=".08" stroke-width="2"/>
  <circle cx="900" cy="40" r="245" fill="none" stroke="white" stroke-opacity=".05" stroke-width="2"/>
  <circle cx="40" cy="470" r="210" fill="none" stroke="white" stroke-opacity=".07" stroke-width="2"/>
  <circle cx="1040" cy="470" r="120" fill="none" stroke="white" stroke-opacity=".06" stroke-width="2"/>
  <g>
    <rect x="104" y="146" width="208" height="208" rx="48" fill="white"/>
    <text x="176" y="278" font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="150" font-weight="800" fill="url(#glyph)">A</text>
    <rect x="238" y="212" width="16" height="72" rx="8" fill="url(#glyph)"/>
    <rect x="210" y="240" width="72" height="16" rx="8" fill="url(#glyph)"/>
  </g>
  <text x="380" y="238" font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="96" font-weight="800" fill="white" letter-spacing="-1">Adhera</text>
  <text x="384" y="296" font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="32" fill="white" fill-opacity=".9">Never miss a dose again.</text>
  <g font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="24" font-weight="600" fill="white">
    <rect x="384" y="336" width="230" height="44" rx="22" fill="white" fill-opacity=".14"/>
    <text x="408" y="366">Medication tracking</text>
    <rect x="626" y="336" width="150" height="44" rx="22" fill="white" fill-opacity=".14"/>
    <text x="654" y="366">Reminders</text>
    <rect x="788" y="336" width="152" height="44" rx="22" fill="white" fill-opacity=".14"/>
    <text x="810" y="366">Family care</text>
  </g>
</svg>`;

await sharp(Buffer.from(featureGraphicSvg)).resize(1024, 500).png().toFile(path.join(outDir, "feature-graphic.png"));

console.log("Wrote store assets to", outDir);