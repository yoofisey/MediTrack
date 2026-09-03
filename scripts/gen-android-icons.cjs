// One-time generator for Adhera Android launcher icons (v3, source-derived).
// Derives all launcher icons from the proven web-app icon (public/icon.svg)
// so the branded look is identical across surfaces.
//
//  - Legacy square/round icons (ic_launcher.png / .round.png): the full
//    icon.svg (brand gradient rounded square + white "A" + medical cross).
//  - Adaptive foreground (ic_launcher_foreground.png): the white glyph only,
//    centered in the safe zone on a transparent canvas (paired with the
//    gradient background drawable @drawable/ic_launcher_background).
//
// Run from repo root:  node scripts/gen-android-icons.cjs
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const RES = "android/app/src/main/res";
const SOURCE = "public/icon.svg";

// White glyph (A + medical cross + faint ring) drawn in a 512-unit box on
// transparent. Rendered large then downscaled so every density stays crisp.
// scale < 1 shrinks the glyph into the adaptive-icon safe zone (central ~66%).
function glyphSvg(canvas, scale) {
  const k = canvas * scale;
  const off = (canvas - k) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
    <g transform="translate(${off},${off}) scale(${canvas ? k / 512 : 1})">
      <text x="140" y="310" font-family="Arial, Helvetica, sans-serif" font-size="170" font-weight="800" fill="white">A</text>
      <rect x="298" y="220" width="18" height="80" rx="9" fill="white"/>
      <rect x="267" y="251" width="80" height="18" rx="9" fill="white"/>
      <circle cx="256" cy="256" r="190" fill="none" stroke="white" stroke-width="6" opacity=".15"/>
    </g>
  </svg>`;
}

const SCALE_MASTER = 8;

async function main() {
  // Legacy icons derive straight from icon.svg at master size, then downscale.
  const legacyMaster = await sharp(SOURCE).resize(512 * SCALE_MASTER).png().toBuffer();
  // Adaptive foreground: white glyph on transparent at master size.
  const fgMaster = await sharp(Buffer.from(glyphSvg(512 * SCALE_MASTER, 0.9))).png().toBuffer();

  const DENSITIES = [
    { dir: "mipmap-mdpi",   legacy: 48,  fg: 108 },
    { dir: "mipmap-hdpi",   legacy: 72,  fg: 162 },
    { dir: "mipmap-xhdpi",  legacy: 96,  fg: 216 },
    { dir: "mipmap-xxhdpi", legacy: 144, fg: 324 },
    { dir: "mipmap-xxxhdpi",legacy: 192, fg: 432 },
  ];

  for (const d of DENSITIES) {
    const fg = await sharp(fgMaster).resize(d.fg, d.fg).png().toBuffer();
    const leg = await sharp(legacyMaster).resize(d.legacy, d.legacy).png().toBuffer();
    const legRound = await sharp(legacyMaster).resize(d.legacy, d.legacy).png().toBuffer();
    writePng(`${RES}/${d.dir}/ic_launcher_foreground.png`, fg);
    writePng(`${RES}/${d.dir}/ic_launcher.png`, leg);
    writePng(`${RES}/${d.dir}/ic_launcher_round.png`, legRound);
    console.log(d.dir);
  }
  console.log("done");
}

function writePng(rel, buf) {
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
}

main().catch(e => { console.error(e); process.exit(1); });
