// Волна 108 (перенос пилота фотографий с site-01/02/03/04): ресайз/сжатие скачанных
// исходников Wikimedia Commons/Pexels до веб-разумных размеров. Исходники —
// 1536×2048 / 4000×3000 / 3000×2000 / 2400×3600, по 0.5–4.3 МБ каждый — публиковать
// в таком виде нельзя (LCP/трафик). По образцу site-01-moscow-avtokran/app/scripts/
// optimize-park-images.mjs.
import sharp from 'sharp';
import { statSync, renameSync } from 'node:fs';

// ВАЖНО: src===out — скрипт сжимает файл, который уже лежит в public/. Повторный
// запуск на уже обработанном файле означает повторное JPEG-сжатие (генерационные
// потери) без какой-либо пользы. Задания ниже комментируются сразу после того, как
// отработали один раз — раскомментировать только если нужно пересобрать конкретный
// файл заново из свежего оригинала в этом же пути.
const jobs = [
  // Волна 108 — уже обработаны, не перезапускать без свежего оригинала:
  // { src: 'public/images/park/kb-408-21.jpg', out: 'public/images/park/kb-408-21.jpg', width: 1280 },
  // { src: 'public/images/park/kb-674a.jpg', out: 'public/images/park/kb-674a.jpg', width: 1280 },
  // { src: 'public/images/park/potain-mdt-219-j10.jpg', out: 'public/images/park/potain-mdt-219-j10.jpg', width: 1280 },
  // { src: 'public/images/hero/park-hero.jpg', out: 'public/images/hero/park-hero.jpg', width: 1920 },
];

for (const job of jobs) {
  const before = statSync(job.src).size;
  const buf = await sharp(job.src).rotate().resize({ width: job.width, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  await sharp(buf).toFile(job.out + '.tmp');
  renameSync(job.out + '.tmp', job.out);
  const after = statSync(job.out).size;
  console.log(`${job.src}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}
