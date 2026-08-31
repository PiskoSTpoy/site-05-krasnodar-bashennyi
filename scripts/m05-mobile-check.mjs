/**
 * m05-mobile-check.mjs — замер мобильной геометрии site-05.
 * Где первая цена, сколько строк в h1 и лиде, есть ли горизонтальная
 * прокрутка и переносы посреди слова в заголовках. Только чтение, ничего
 * не меняет. Запуск: node scripts/m05-mobile-check.mjs --base http://127.0.0.1:8855
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHELL =
  'C:/Users/kamne/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';

const arg = (n, d = null) => {
  const i = process.argv.indexOf('--' + n);
  return i === -1 ? d : process.argv[i + 1];
};
const BASE = (arg('base') || 'http://127.0.0.1:8855').replace(/\/$/, '');
const PATHS = (arg('paths') || '/,/park/,/documents/').split(',');
const WIDTHS = (arg('widths') || '375,360,320').split(',').map(Number);

const PORT = await new Promise((res, rej) => {
  const srv = createServer();
  srv.on('error', rej);
  srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => res(p)); });
});
const proc = spawn(SHELL, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(tmpdir(), `m05-${process.pid}-${PORT}`)}`,
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
  '--disable-dev-shm-usage', '--window-size=375,812', 'about:blank',
], { stdio: 'ignore' });

async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const pages = list.filter((t) => t.type === 'page');
      if (pages.some((t) => t.url && t.url !== 'about:blank')) throw new Error('чужой браузер на порту');
      if (pages[0]?.webSocketDebuggerUrl) return pages[0].webSocketDebuggerUrl;
    } catch (e) { if (String(e.message).includes('чужой')) throw e; }
    await sleep(250);
  }
  throw new Error('headless-shell не поднялся');
}
const ws = new WebSocket(await target());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable'); await send('Runtime.enable');

const EXPR = String.raw`(() => {
  const de = document.documentElement;
  const top = (el) => el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
  const rows = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    return Math.round(el.getBoundingClientRect().height / lh * 10) / 10;
  };
  let priceY = null, priceTxt = null;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode.nodeValue || '';
    const m = t.match(/\d[\d\s\u00a0]*\s*(₽|руб)/);
    if (!m) continue;
    const el = w.currentNode.parentElement;
    if (!el || el.getBoundingClientRect().height === 0) continue;
    const r = document.createRange();
    r.setStart(w.currentNode, m.index); r.setEnd(w.currentNode, m.index + m[0].length);
    const rr = r.getBoundingClientRect();
    priceY = Math.round((rr.height ? rr.top : el.getBoundingClientRect().top) + window.scrollY);
    priceTxt = m[0].trim(); break;
  }
  const over = [...document.querySelectorAll('*')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((o) => o.r.right > de.clientWidth + 0.5 && o.r.width > 0
                   && getComputedStyle(o.el).position !== 'fixed'
                   && !String(o.el.className).includes('skip'))
    .slice(0, 4)
    .map((o) => o.el.tagName + '.' + String(o.el.className || '').slice(0, 24) + ' r=' + Math.round(o.r.right));
  const h1 = document.querySelector('h1');
  const lead = document.querySelector('.dossier__lead, main .prose > p');
  return {
    scrollW: de.scrollWidth, clientW: de.clientWidth, docH: document.body.scrollHeight,
    hScroll: de.scrollWidth > de.clientWidth + 0.5, over,
    h1Y: top(h1), h1Rows: rows(h1),
    leadY: top(lead), leadRows: rows(lead),
    priceY, priceTxt,
    navH: Math.round((document.querySelector('.nav')?.getBoundingClientRect().height) || 0),
    scrollPadTop: getComputedStyle(de).scrollPaddingTop,
  };
})()`;

const out = {};
for (const width of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 2, mobile: true });
  for (const p of PATHS) {
    await send('Page.navigate', { url: BASE + p });
    await sleep(1400);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight); void 0' });
    await sleep(600);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0); void 0' });
    await sleep(300);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: EXPR });
    out[`${width}px ${p}`] = r?.result?.result?.value || { error: JSON.stringify(r).slice(0, 200) };
  }
}
console.log(JSON.stringify(out, null, 1));
ws.close(); proc.kill();
