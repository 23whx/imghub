import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { mbtiGroups } from '../src/data/mbti.js';

const sources = fileURLToPath(new URL('../output/mbti-characters-v1/', import.meta.url));
const destination = fileURLToPath(new URL('../public/assets/mbti/', import.meta.url));
await mkdir(destination, { recursive: true });

for (const [index, group] of mbtiGroups.entries()) {
  const source = `${sources}${String(index + 1).padStart(2, '0')}-${group.id}.png`;
  const { width } = await sharp(source).metadata();
  await sharp(source).resize({ width: 1440 }).webp({ quality: 88 }).toFile(`${destination}${group.id}.webp`);
  for (const [column, type] of group.types.entries()) {
    // Remove the baked-in labels, keeping the approved whole figure and props.
    const left = Math.round(width * column / 4);
    const right = Math.round(width * (column + 1) / 4);
    await sharp(source)
      .extract({ left, top: 0, width: right - left, height: 730 })
      .resize({ width: 360 })
      .webp({ quality: 90 })
      .toFile(`${destination}${type.toLowerCase()}.webp`);
  }
}
console.log('Created 16 character WebPs and four group example WebPs.');
