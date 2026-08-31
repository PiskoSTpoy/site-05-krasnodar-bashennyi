// Волна 127 (перенос паттерна с site-01, Волна 122): сжатие скачанного оригинала
// фонового видео hero до веб-разумного размера + извлечение постера. По образцу
// site-01-moscow-avtokran/app/scripts/optimize-hero-video.mjs и локального
// optimize-park-images.mjs (массив jobs, src/out явно раздельные пути, до/после
// в консоли), но для видео вместо sharp используется ffmpeg-static — единственный
// портируемый способ дать H.264-кодек без системной зависимости от ffmpeg на
// машине разработчика (Windows/mac/Linux).
//
// ВАЖНО: исходник — НЕ в public/. Раздавать посетителям сырой файл 6+ МБ с
// оригинальным разрешением незачем (используется только как вход в сжатие), а
// на выходе всегда попадает в public/ ровно одна оптимизированная версия.
// Источник (автор/лицензия/ссылка) см. content-plan.md, «Волна 127».
import { execFileSync } from 'node:child_process';
import { statSync, mkdirSync, existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

const jobs = [
  {
    src: 'scripts/source-assets/hero-tower-original.mp4',
    outVideo: 'public/videos/hero-tower.mp4',
    outPoster: 'public/images/hero/hero-tower-poster.jpg',
    // Не выше 1280px по широкой стороне (ТЗ) — исходник 1920x1080, поэтому
    // масштаб всегда вниз; -2 у высоты — чётность обязательна для libx264.
    width: 1280,
    // Кадр постера берётся НЕ с нулевой секунды: у большинства стоковых клипов
    // первый кадр — технический (чёрный/наезд объектива), секунда 1.0 обычно уже
    // внутри содержательного плана. Значение можно переопределить на видео.
    posterAt: '00:00:01',
  },
];

for (const job of jobs) {
  if (!existsSync(job.src)) {
    console.error(`Пропуск: исходник не найден — ${job.src}. Скачайте оригинал в scripts/source-assets/ перед запуском.`);
    continue;
  }
  mkdirSync('public/videos', { recursive: true });
  mkdirSync('public/images/hero', { recursive: true });

  const before = statSync(job.src).size;

  // H.264 mp4, без звука (-an — задание прямо требует беззвучный луп), масштаб
  // до job.width по ширине с сохранением пропорций (высота считается ffmpeg-ом,
  // -2 округляет до чётного числа), CRF 28 (баланс размер/качество для фонового,
  // не первоплановое видео) + faststart (moov-атом в начале файла — воспроизведение
  // стартует до полной загрузки, важно при autoplay в браузере).
  // -map_metadata -1: исходник может нести служебные теги (creation_time и т.п.)
  // стокового сервиса — они не нужны на выходе и не имеют отношения к контенту.
  execFileSync(ffmpegPath, [
    '-y',
    '-i', job.src,
    '-an',
    '-map_metadata', '-1',
    '-vf', `scale=${job.width}:-2:flags=lanczos`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    job.outVideo,
  ], { stdio: 'inherit' });

  // Постер — кадр из УЖЕ сжатого файла (тот же размер/цветокоррекция, что и
  // видео, а не случайно другое разрешение оригинала).
  execFileSync(ffmpegPath, [
    '-y',
    '-ss', job.posterAt,
    '-i', job.outVideo,
    '-frames:v', '1',
    '-q:v', '3',
    job.outPoster,
  ], { stdio: 'inherit' });

  const afterVideo = statSync(job.outVideo).size;
  const afterPoster = statSync(job.outPoster).size;
  console.log(
    `${job.src}: ${(before / 1024 / 1024).toFixed(2)} MB -> ${job.outVideo}: ${(afterVideo / 1024 / 1024).toFixed(2)} MB` +
    ` | постер ${job.outPoster}: ${(afterPoster / 1024).toFixed(0)} KB`
  );
  if (afterVideo > 3 * 1024 * 1024) {
    console.warn(`ВНИМАНИЕ: ${job.outVideo} тяжелее 3 МБ (цель ТЗ — 2–3 МБ). Поднимите CRF (например 30–32) и перезапустите.`);
  }
}
