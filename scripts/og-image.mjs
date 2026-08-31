/**
 * og-image.mjs — статичная OG-картинка 1200×630 для превью в мессенджерах.
 * Без неё ссылка на сайт разворачивается голым текстом.
 *
 * Сборка SVG → PNG через sharp. Именно PNG: Telegram, VK и WhatsApp растровые
 * og:image понимают, а SVG почти все игнорируют.
 *
 * ПРО ШРИФТЫ — важная оговорка. librsvg внутри sharp берёт шрифты из системы,
 * а не из public/fonts, поэтому Prata и Literata здесь недоступны. Взята
 * Georgia — системная антиква с полной кириллицей, ближайшая по духу к
 * редакционному набору сайта. Результат просматривался глазами, а не «должен
 * работать»: если сборка переедет на машину без Georgia, текст уедет в другую
 * гарнитуру и картинку надо будет пересмотреть, а не выкладывать вслепую.
 *
 * ЧТО НА КАРТИНКЕ. Только то, что есть на сайте: название, зона работы
 * (Краснодарский край), пять этапов жизненного цикла крана из /etapy/ и силуэт
 * башенного крана из favicon.svg. Ни одной цифры про парк, стаж или объекты.
 *
 * Запуск: node scripts/og-image.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'og-cover.png');

const BG = '#FAF7F0';
const INK = '#241F1A';
const MUTED = '#6B6157';
const ACCENT = '#A6432A';
const LINE = '#E4DCCB';
const FONT = "Georgia, 'Times New Roman', serif";

const stages = ['Изыскания', 'Проект и ППР', 'Монтаж', 'Эксплуатация', 'Демонтаж'];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>

  <!-- рамка дела: та же двойная линия, что у .dossier__stamp на сайте -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${INK}" stroke-width="2"/>
  <rect x="52" y="52" width="1096" height="526" fill="none" stroke="${LINE}" stroke-width="2"/>

  <!-- рубрика -->
  <text x="96" y="132" font-family="${FONT}" font-size="26" letter-spacing="3.4" fill="${ACCENT}">ПРОЕКТНОЕ ДОСЬЕ</text>
  <line x1="96" y1="152" x2="1104" y2="152" stroke="${LINE}" stroke-width="2"/>

  <!-- заголовок -->
  <text x="96" y="248" font-family="${FONT}" font-size="72" fill="${INK}">Башенный кран</text>
  <text x="96" y="330" font-family="${FONT}" font-size="72" fill="${INK}">на Кубани</text>

  <text x="96" y="392" font-family="${FONT}" font-size="30" fill="${MUTED}">Краснодарский край · сейсмика площадки и закон о тишине</text>

  <!-- пять этапов жизненного цикла -->
  <line x1="96" y1="452" x2="1104" y2="452" stroke="${INK}" stroke-width="2"/>
  ${stages.map((s, i) => {
    const x = 96 + i * 202;
    return `<text x="${x}" y="500" font-family="${FONT}" font-size="22" fill="${ACCENT}">0${i + 1}</text>
    <text x="${x}" y="534" font-family="${FONT}" font-size="26" fill="${INK}">${s}</text>`;
  }).join('\n  ')}

  <!-- силуэт башенного крана — та же геометрия, что в favicon.svg -->
  <g transform="translate(940 186) scale(3)">
    <rect x="28" y="18" width="7" height="36" fill="${INK}"/>
    <rect x="20" y="50" width="23" height="4" fill="${INK}"/>
    <rect x="10" y="14" width="44" height="5" fill="${ACCENT}"/>
    <rect x="10" y="19" width="7" height="6" fill="${INK}"/>
    <rect x="44" y="19" width="3" height="17" fill="${INK}"/>
    <rect x="41" y="36" width="9" height="4" fill="${INK}"/>
  </g>

  <text x="1104" y="132" text-anchor="end" font-family="${FONT}" font-size="26" letter-spacing="2" fill="${INK}">КРАН-КУБАНЬ</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`og-cover.png собран: ${OUT}`);
