/**
 * Generates the Website's responsive WebP images from the PNG masters (C-02 / F1).
 *
 *   npm run images:optimize          regenerate every output listed below
 *   npm run images:optimize -- --check
 *                                    fail if an output is missing, or if a PNG/JPEG
 *                                    has crept back into public/ (it would ship)
 *
 * Masters live in images-src/ - outside public/, so the multi-hundred-KB
 * originals are never copied into the build. Outputs go to public/assets/ and
 * ARE committed, so a build needs no native image tooling (D-046).
 *
 * Widths come from measured rendered sizes at 375/768/1024/1440/1920 in both
 * locales, at 1x and 2x density. A width is never larger than its master:
 * `withoutEnlargement` refuses to upscale, and such a width is skipped with a
 * warning rather than emitted as a blurry file under a sharper-sounding name.
 *
 * WebP only, no AVIF: WebP already cuts these files by 93-97%, AVIF saves a
 * further 10-16 KB per image at the cost of <picture> markup and a second file
 * set, and it decodes slower on low-end phones, where the LCP matters most.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'images-src');
const OUT = join(ROOT, 'public', 'assets');

/** Master (relative to images-src/, no extension) -> output widths in px. */
const MANIFEST = {
  // LCP element on the landing page: 200px mobile, 438px desktop.
  'landing/hero-illustration': [200, 438, 876],
  'landing/hero-card': [144, 288],
  // The Arabic mockups were exported at 1x only (197px / 298px wide), so
  // they get a single native width - see finding C-04.
  'landing/next-mockup-banner': [194, 388],
  'landing/next-mockup-banner-ar': [197],
  'landing/next-mockup-dashboard': [288, 576],
  'landing/next-mockup-dashboard-ar': [298],
  // 372px mobile, up to 620px laptop, 774px desktop.
  'who-we-are/hero-map': [372, 774, 1024],
  'who-we-are/hero-map-ar': [372, 774, 1024],
  // Rendered up to 620px; the master is 498px wide, so that is the ceiling.
  'contact/rectangle': [343, 498],
};

const WEBP = { quality: 80, effort: 6 };

const outPath = (name, width) => join(OUT, `${name}-${width}.webp`);

function strayRasters(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) return strayRasters(p);
    return /\.(png|jpe?g)$/i.test(entry) ? [relative(ROOT, p)] : [];
  });
}

async function generate() {
  let total = 0;
  for (const [name, widths] of Object.entries(MANIFEST)) {
    const src = join(SRC, `${name}.png`);
    const { width: masterWidth } = await sharp(src).metadata();
    for (const width of widths) {
      if (width > masterWidth) {
        console.warn(`skip ${name} @${width}: master is only ${masterWidth}px wide`);
        continue;
      }
      const dest = outPath(name, width);
      mkdirSync(dirname(dest), { recursive: true });
      const info = await sharp(src).resize({ width, withoutEnlargement: true }).webp(WEBP).toFile(dest);
      total += info.size;
      console.log(`${relative(ROOT, dest).padEnd(58)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
    }
  }
  console.log(`\n${(total / 1024).toFixed(1)} KB across all outputs`);
}

function check() {
  const problems = [];
  for (const [name, widths] of Object.entries(MANIFEST)) {
    if (!existsSync(join(SRC, `${name}.png`))) problems.push(`missing master images-src/${name}.png`);
    for (const width of widths) {
      if (!existsSync(outPath(name, width))) problems.push(`missing ${relative(ROOT, outPath(name, width))}`);
    }
  }
  for (const stray of strayRasters(join(ROOT, 'public'))) {
    problems.push(`${stray} would ship as an unoptimised raster; add it to images-src/ and the manifest`);
  }
  if (problems.length) {
    problems.forEach((p) => console.error(p));
    process.exit(1);
  }
  console.log('images: every output present, no stray PNG/JPEG in public/');
}

if (process.argv.includes('--check')) check();
else await generate();
