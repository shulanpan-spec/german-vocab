import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('public/icons', { recursive: true });

const svg = (size, opts = {}) => {
  const { padding = 0 } = opts;
  const inner = size - padding * 2;
  const fontSize = Math.round(inner * 0.50);
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#1f2937"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
            font-family="Georgia, serif" font-weight="bold" font-size="${fontSize}" fill="white">
        DE
      </text>
    </svg>
  `);
};

async function gen(name, size, opts) {
  const out = join('public', 'icons', name);
  await sharp(svg(size, opts)).png().toFile(out);
  console.log(`wrote ${out}`);
}

await gen('icon-192.png', 192);
await gen('icon-512.png', 512);
// Maskable icon: needs ~10% safe zone padding so the brand survives masking
await gen('icon-512-maskable.png', 512, { padding: 64 });
