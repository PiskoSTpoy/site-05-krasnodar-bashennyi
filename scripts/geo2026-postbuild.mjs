// Патч под скилл seo-2026-playbook: id на H2 + TOC для страниц, где своей
// обвязки ещё нет.
//
// У блога уже есть полная инфраструктура (BlogArticleLayout.astro, headings
// проставляются вручную в каждой статье через lib/slug.ts slugify, TOC
// desktop/mobile рендерится Astro-компонентом на сервере) — почти все H2
// блога уже с id, кроме одного (см. ниже). У остальных типов страниц
// (park/etapy/seysmozony/documents/kontakty/faq/index/...) нет НИЧЕГО из
// этого — они используют BaseLayout напрямую.
//
// Астро на этом сайте не гидратирует клиентские компоненты (grep по
// client:load/idle/visible/only ничего не нашёл — весь интерактив собран
// обычными <script> без фреймворка), поэтому классического React/Vue
// hydration-mismatch здесь в принципе быть не может: вставка нового узла в
// статический HTML безопасна для гидратации. Тем не менее живая проверка
// консоли перед коммитом — обязательна, не как исключение из общего правила,
// а как его подтверждение для конкретного сайта (см. STATUS.md).
//
// TOC для страниц без своей обвязки — самодостаточный инлайновый блок
// (свой <style>, класс .g26-toc), а не копия .toc-desktop блога: та вёрстка
// объявлена is:global внутри BlogArticleLayout.astro и бандлится Astro
// только на страницы, которые импортируют этот layout, — на park/etapy/...
// этих стилей в бандле просто нет.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[«»"'""„‟]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const TOC_STYLE = `<style>
.g26-toc{margin:0 0 28px;padding:16px 18px;border:1px solid rgba(0,0,0,.12);border-radius:10px;background:rgba(0,0,0,.02);max-width:640px}
.g26-toc__title{font-weight:700;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px;opacity:.7}
.g26-toc ol{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.g26-toc a{text-decoration:none;font-size:.92rem}
.g26-toc a:hover{text-decoration:underline}
@media (prefers-color-scheme: dark){.g26-toc{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.03)}}
</style>`;

function patchOne(path) {
  let html = readFileSync(path, "utf8");
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!m) return false;
  const openTag = m[0].match(/<main[^>]*>/)[0];
  let main = m[1];
  const hasOwnToc = /class="toc-desktop"|class="toc-mobile"|class="g26-toc"/.test(main);
  const used = new Set();
  const items = [];
  let changed = false;

  main = main.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (full, attrs, text) => {
    let id;
    const idm = attrs.match(/id="([^"]*)"/);
    if (idm) {
      id = idm[1];
    } else {
      const t = stripTags(text);
      if (!t) return full;
      const base = slugify(t) || "section";
      id = base;
      let i = 2;
      while (used.has(id)) id = `${base}-${i++}`;
      attrs = ` id="${id}"${attrs}`;
      changed = true;
    }
    used.add(id);
    items.push({ id, text: stripTags(text) });
    return `<h2${attrs}>${text}</h2>`;
  });

  if (items.length >= 3 && !hasOwnToc) {
    const list = items.map((it) => `<li><a href="#${it.id}">${it.text}</a></li>`).join("");
    const nav = `${TOC_STYLE}<nav class="g26-toc" aria-label="Содержание"><p class="g26-toc__title">На этой странице</p><ol>${list}</ol></nav>`;
    const firstH2 = main.indexOf("<h2");
    if (firstH2 !== -1) {
      main = main.slice(0, firstH2) + nav + main.slice(firstH2);
      changed = true;
    }
  }

  if (!changed) return false;
  html = html.slice(0, m.index) + openTag + main + "</main>" + html.slice(m.index + m[0].length);
  writeFileSync(path, html, "utf8");
  return true;
}

const files = walk(DIST);
let n = 0;
for (const f of files) if (patchOne(f)) n++;
console.log(`geo2026-postbuild: обработано ${files.length} файлов, изменено ${n}`);
