// Пост-обработка карты сайта: проставить честный lastmod и сверить состав.
//
// ЗАЧЕМ. Карта сайта здесь ведётся руками (public/sitemap.xml), интеграции
// @astrojs/sitemap на проекте нет. До этого шага в ней не было lastmod вообще,
// и поисковик просто не получал сигнала свежести.
//
// ПОЧЕМУ НЕ ДАТА СБОРКИ. Google учитывает lastmod, только если он
// последовательно и проверяемо точен. Одинаковая дата у всех страниц — это
// дата сборки, а не изменения контента; такой сигнал обесценивается для всего
// домена. Поэтому дата берётся из mtime ИСХОДНОГО файла конкретной страницы
// (src/pages/<путь>/index.astro), и две сборки подряд без правок контента дают
// побайтово одинаковый sitemap.
//
// ЧЕСТНАЯ ОГОВОРКА. mtime — свойство файловой системы: чистый клон репозитория
// проставит всем файлам время выкачки, и тогда даты снова станут одинаковыми.
// Проверка ниже это ловит: если различных отметок меньше двух, lastmod не
// записывается ВООБЩЕ. Лучше не отдать сигнал, чем отдать заведомо ложный.
//
// ЗАОДНО сверяется состав карты с деревом собранных страниц: в прошлых волнах
// сети карта уже отставала от сайта на полтора десятка URL, и заметили это
// далеко не сразу. Расхождение — ошибка сборки, а не предупреждение.
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(APP, 'dist');
const PAGES = join(APP, 'src', 'pages');
const SITEMAP = join(DIST, 'sitemap.xml');

const pad = (n) => String(n).padStart(2, '0');

// W3C Datetime в ЛОКАЛЬНОЙ зоне со смещением: 2026-08-26T00:47:57+03:00.
// Не UTC с «Z»: сайт про Краснодарский край, правки делаются по местному
// времени, и правка от 00:47 26-го числа в UTC превратилась бы в 21:47 25-го —
// дата в карте разъехалась бы с датой, которую видел человек. Обе формы
// допустимы стандартом, момент времени один и тот же.
function w3cDatetime(d) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

// Путь URL → исходный файл страницы. Астро-роутинг здесь простой: каждая
// страница лежит как <путь>/index.astro, главная — src/pages/index.astro.
function sourceFor(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [join(PAGES, clean, 'index.astro'), join(PAGES, `${clean}.astro`)]
    : [join(PAGES, 'index.astro')];
  return candidates.find((p) => existsSync(p)) || null;
}

// Все собранные страницы: dist/**/index.html, кроме 404 и редиректных заглушек
// (у редиректа Astro кладёт html с <meta http-equiv="refresh">, в карте таким
// адресам не место).
function builtPages(dir = DIST, prefix = '/') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...builtPages(join(dir, entry.name), `${prefix}${entry.name}/`));
    } else if (entry.name === 'index.html') {
      const html = readFileSync(join(dir, entry.name), 'utf-8');
      if (!/http-equiv="?refresh/i.test(html)) out.push(prefix);
    }
  }
  return out;
}

const before = readFileSync(SITEMAP, 'utf-8');
const locs = [...before.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
if (!locs.length) {
  console.error('sitemap: не найдено ни одного <loc> — карта пуста или сломана');
  process.exit(1);
}

const origin = new URL(locs[0]).origin;
const inMap = new Set(locs.map((u) => new URL(u).pathname));
const onDisk = new Set(builtPages());

const missing = [...onDisk].filter((p) => !inMap.has(p)).sort();
const extra = [...inMap].filter((p) => !onDisk.has(p)).sort();
if (missing.length || extra.length) {
  if (missing.length) console.error(`sitemap: НЕТ в карте, но есть в сборке (${missing.length}): ${missing.join(', ')}`);
  if (extra.length) console.error(`sitemap: ЕСТЬ в карте, но нет в сборке (${extra.length}): ${extra.join(', ')}`);
  process.exit(1);
}

// Собираем даты до записи: если различных значений меньше двух, lastmod
// не проставляем вовсе (см. оговорку про mtime в шапке файла).
const stamps = new Map();
const noSource = [];
for (const pathname of inMap) {
  const src = sourceFor(pathname);
  if (!src) { noSource.push(pathname); continue; }
  stamps.set(pathname, w3cDatetime(statSync(src).mtime));
}
if (noSource.length) {
  console.error(`sitemap: не найден исходник страницы (${noSource.length}): ${noSource.join(', ')}`);
  process.exit(1);
}

const distinct = new Set(stamps.values());
if (distinct.size < 2) {
  console.warn(
    'sitemap: у всех страниц совпали mtime — вероятно, свежий клон репозитория. ' +
    'lastmod НЕ проставлен: одинаковая дата у всего домена обесценивает сигнал ' +
    'сильнее, чем его отсутствие.'
  );
  process.exit(0);
}

// Пишем/обновляем <lastmod> внутри каждого <url>, не трогая остальное.
let written = 0;
const after = before.replace(/<url>([\s\S]*?)<\/url>/g, (whole, inner) => {
  const m = inner.match(/<loc>\s*([^<\s]+)\s*<\/loc>/);
  if (!m) return whole;
  const stamp = stamps.get(new URL(m[1], origin).pathname);
  if (!stamp) return whole;
  written += 1;
  const cleaned = inner.replace(/<lastmod>[^<]*<\/lastmod>/g, '');
  return `<url>${cleaned.replace(/<\/loc>/, `</loc><lastmod>${stamp}</lastmod>`)}</url>`;
});

writeFileSync(SITEMAP, after, 'utf-8');
console.log(
  `sitemap: страниц ${inMap.size}, lastmod проставлен ${written}, различных дат ${distinct.size}; ` +
  'состав карты совпадает с деревом сборки'
);
