// Generates every icon surface (web/PWA, store, Android, iOS) from the brand
// logo master. Composition: the logo mark is centered on the app's blue->indigo
// gradient tile (the logo's own transparent padding supplies the inner margin).
//
// Sources:
//   - "adhera logo.png" / store/icon-master.png  (square tile + centered mark)
//   - store/icon-mark.png                         (logo alone on transparent, adaptive fg)
//
// Run from repo root:  node scripts/gen-icons.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGO_SRC = path.join(root, "adhera logo.png");
const MASTER = path.join(root, "store", "icon-master.png");
const MARK = path.join(root, "store", "icon-mark.png");
const WEB_DIR = path.join(root, "public");
const STORE_DIR = path.join(root, "store");
const ANDROID_RES = path.join(root, "android", "app", "src", "main", "res");
const IOS_ICON = path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png");

const GRAD_START = "#007AFF";
const GRAD_END = "#5856D6";
const TILE_SCALE = 0.86; // logo (incl. its transparent margin) covers 86% of the tile
const FG_SCALE = 0.72;   // logo on the Android adaptive foreground canvas (safe-zone friendly)
const WEB_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const DENSITIES = [
  { dir: "mipmap-mdpi",   legacy: 48,  fg: 108 },
  { dir: "mipmap-hdpi",   legacy: 72,  fg: 162 },
  { dir: "mipmap-xhdpi",  legacy: 96,  fg: 216 },
  { dir: "mipmap-xxhdpi", legacy: 144, fg: 324 },
  { dir: "mipmap-xxxhdpi",legacy: 192, fg: 432 },
];

function gradientTile(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GRAD_START}"/><stop offset="1" stop-color="${GRAD_END}"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg);
}

function roundedMask(size, radius) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" fill="white"/>
  </svg>`;
  return Buffer.from(svg);
}

// Square gradient tile with the logo centered (transparent corners of the logo
// pass through to the gradient).
async function tile(size) {
  const logo = await sharp(LOGO_SRC).resize(Math.round(size * TILE_SCALE), Math.round(size * TILE_SCALE)).png().toBuffer();
  const off = Math.round((size - Math.round(size * TILE_SCALE)) / 2);
  return sharp(gradientTile(size)).composite([{ input: logo, left: off, top: off }]).png().toBuffer();
}

// Rounded-corner version of the tile.
async function tileRounded(size, radius = Math.round(size * 0.22)) {
  const t = await tile(size);
  return sharp(t).composite([{ input: roundedMask(size, radius), blend: "dest-in" }]).png().toBuffer();
}

// Logo alone on a transparent canvas (Android adaptive foreground).
async function mark(size, scale = FG_SCALE) {
  const logo = await sharp(LOGO_SRC).resize(Math.round(size * scale), Math.round(size * scale)).png().toBuffer();
  const off = Math.round((size - Math.round(size * scale)) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, left: off, top: off }])
    .png()
    .toBuffer();
}

function write(rel, buf) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
}

async function main() {
  // --- Canonical masters ---
  write("store/icon-master.png", await tile(1024));
  write("store/icon-mark.png", await mark(1024));

  // --- Web / PWA icons (rounded tile) ---
  for (const size of WEB_SIZES) {
    write(`public/icon-${size}.png`, await tileRounded(size));
  }
  write("public/apple-touch-icon.png", await tile(180));

  // --- favicon + notification master (SVG wrapper embedding a 512 tile) ---
  const tile512 = await tileRounded(512);
  const b64 = tile512.toString("base64");
  write("public/icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${b64}" width="512" height="512"/>
</svg>
`);

  // --- Store assets ---
  write("store/icon-512.png", await tile(512));
  write("store/icon-1024.png", await tile(1024));

  const logoTile512 = await tileRounded(512, 112);
  const tileB64 = logoTile512.toString("base64");
  const featureGraphicSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GRAD_START}"/>
      <stop offset="100%" stop-color="${GRAD_END}"/>
    </linearGradient>
    <clipPath id="tileClip"><rect x="104" y="146" width="208" height="208" rx="48"/></clipPath>
  </defs>
  <rect width="1024" height="500" fill="url(#fg)"/>
  <circle cx="900" cy="40" r="170" fill="none" stroke="white" stroke-opacity=".08" stroke-width="2"/>
  <circle cx="900" cy="40" r="245" fill="none" stroke="white" stroke-opacity=".05" stroke-width="2"/>
  <circle cx="40" cy="470" r="210" fill="none" stroke="white" stroke-opacity=".07" stroke-width="2"/>
  <circle cx="1040" cy="470" r="120" fill="none" stroke="white" stroke-opacity=".06" stroke-width="2"/>
  <image xlink:href="data:image/png;base64,${tileB64}" x="104" y="146" width="208" height="208" clip-path="url(#tileClip)" preserveAspectRatio="xMidYMid slice"/>
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
  write("store/feature-graphic.png", await sharp(Buffer.from(featureGraphicSvg)).resize(1024, 500).png().toBuffer());

  // --- Android launcher icons ---
  for (const d of DENSITIES) {
    const leg = await tileRounded(d.legacy, Math.round(d.legacy * 0.22));
    const fg = await mark(d.fg);
    write(`${path.relative(root, ANDROID_RES)}/${d.dir}/ic_launcher.png`, leg);
    write(`${path.relative(root, ANDROID_RES)}/${d.dir}/ic_launcher_round.png`, leg);
    write(`${path.relative(root, ANDROID_RES)}/${d.dir}/ic_launcher_foreground.png`, fg);
  }

  // --- iOS app icon (square, 1024@2x) ---
  write(path.relative(root, IOS_ICON), await tile(1024));

  console.log("Done. Generated masters, web icons, store assets, Android launcher icons, iOS app icon.");
}

main().catch(e => { console.error(e); process.exit(1); });