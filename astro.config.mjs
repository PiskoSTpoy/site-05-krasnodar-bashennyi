import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kran-kuban.ru',

  redirects: {
    // ── Волна 14 (дедупликация) + Волна 17 (топология) ─────────────────────
    // Четыре страницы были типовым каркасом без собственного кубанского
    // содержания и удалены. До Волны 17 их URL уходили постоянным редиректом
    // на ЧУЖОЙ домен — это убрано: 301 с домена A на домен B технически
    // означает «сайты под общим управлением», и для площадки, которая
    // представляется независимой краснодарской компанией, это ложное
    // заявление. Переносить было нечего: домен не опубликован, веса на старых
    // URL не существует. Адресатом стал собственный раздел, где тема реально
    // раскрыта под кубанским углом.
    '/documents/dokumenty-na-tehniku-i-operatora': { status: 301, destination: '/documents/' },
    '/documents/dogovor-arendy-krana': { status: 301, destination: '/documents/' },
    '/documents/akt-vypolnennyh-rabot': { status: 301, destination: '/etapy/demontazh-i-perebazirovka/' },
    '/blog/registratsiya-krana-v-rostehnadzore': { status: 301, destination: '/documents/' },

    // ── Волна 16 (смена главной оси сайта) ────────────────────────────────
    // Сайт перестроен с продажи услуг на ЖИЗНЕННЫЙ ЦИКЛ крана на объекте.
    // Башенный кран арендуют месяцами и решают на стадии проекта, поэтому
    // разделы «услуги» и «примеры задач» расформированы: их содержание
    // разложено по этапам /etapy/, а география по городам заменена на
    // /seysmozony/ — для башенного крана решает расчётная сейсмичность
    // площадки, а не название города. Ни одна страница не удалена «в никуда»:
    // каждый старый URL ведёт туда, куда переехало его содержание.
    '/uslugi/arenda-bashennogo-krana': { status: 301, destination: '/etapy/' },
    '/uslugi/avtokran-kubani': { status: 301, destination: '/etapy/ekspluatatsiya-i-tishina/' },

    '/keysy': { status: 301, destination: '/etapy/' },
    '/keysy/montazh-v-seysmozone-sochi': { status: 301, destination: '/etapy/montazh-i-ankerovka/' },
    '/keysy/ostanovka-iz-za-nord-osta': { status: 301, destination: '/etapy/ekspluatatsiya-i-tishina/' },
    '/keysy/avtokran-v-istoricheskom-centre': { status: 301, destination: '/etapy/proekt-i-ppr/' },
    '/keysy/rabota-na-peschanom-grunte-anapa': { status: 301, destination: '/etapy/izyskaniya-i-grunt/' },

    '/geo/sochi': { status: 301, destination: '/seysmozony/' },
    '/geo/novorossiysk': { status: 301, destination: '/etapy/ekspluatatsiya-i-tishina/' },
    '/geo/anapa': { status: 301, destination: '/etapy/izyskaniya-i-grunt/' },
    '/geo/krasnodar': { status: 301, destination: '/etapy/proekt-i-ppr/' },
  },
});
