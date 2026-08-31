// Сборка WebP-двойников для всех растровых изображений public/images.
//
// Оригиналы НЕ трогаются: скрипт только кладёт рядом .webp. В разметке
// оригинал остаётся в <img> (и в fallback у image-set в CSS), WebP уходит в
// <source type="image/webp"> — браузер, который его не понимает, получает
// прежний JPEG, а не пустое место.
//
// Идемпотентность: файл пересобирается, только если оригинал новее двойника.
// Повторный прогон на неизменённых картинках ничего не пишет.
//
// ЕСЛИ WEBP ПОЛУЧИЛСЯ ТЯЖЕЛЕЕ ОРИГИНАЛА — он удаляется, а имя попадает в
// список skipped. Такое бывает на схемах и графике с плоскими заливками;
// подсовывать браузеру заведомо более тяжёлый файл смысла нет.
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const RASTER = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (RASTER.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

let made = 0, kept = 0;
const skipped = [];
for (const src of walk(ROOT)) {
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) { kept += 1; continue; }
  await sharp(src).webp({ quality: 80, effort: 6 }).toFile(out);
  const a = statSync(src).size, b = statSync(out).size;
  if (b >= a) {
    unlinkSync(out);
    skipped.push(`${src.replace(ROOT, '')} (webp ${(b / 1024).toFixed(0)} КБ ≥ оригинал ${(a / 1024).toFixed(0)} КБ)`);
    continue;
  }
  made += 1;
  console.log(`${src.replace(ROOT, '')}: ${(a / 1024).toFixed(0)} КБ -> webp ${(b / 1024).toFixed(0)} КБ (−${Math.round((1 - b / a) * 100)}%)`);
}
if (skipped.length) console.log(`Оставлены только оригиналы (webp не выиграл): ${skipped.join('; ')}`);
console.log(`webp: создано ${made}, актуальных без пересборки ${kept}, пропущено ${skipped.length}`);
