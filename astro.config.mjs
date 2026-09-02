import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kran-kuban.ru',

  redirects: {
    // ── Волна 14 (дедупликация) + Волна 17 (топология) + правка 03.09.2026 ──
    // Четыре страницы были типовым каркасом без собственного кубанского
    // содержания (федеральные темы, владелец site-01) и удалены. До Волны 17
    // их URL уходили постоянным редиректом на ЧУЖОЙ домен — это было убрано,
    // но заменено внутренним 301 на свой же раздел. Правка 03.09.2026
    // (вариант Б, TOPIC-REGISTRY.md): «301-to-owner» при формально
    // независимой сети значит удалить страницу целиком, без какого-либо
    // редиректа — старый URL отдаёт обычный 404, как и положено удалённой
    // странице. Уникальная кубанская оговорка каждой страницы уже перенесена
    // абзацем в живой раздел (акт готовности крана с учётом сейсмики — в
    // /blog/izyskaniya-pered-montazhom-krana/, см. комментарий там).

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

    // ── Аудит 02.09.2026: сами хабы /uslugi/ и /geo/ (без конкретной
    // подстраницы) отдавали 404 — выше редиректятся только их бывшие
    // подстраницы, а адрес самого раздела не был учтён нигде. sitemap.xml
    // утверждает, что раздел целиком редиректит, — теперь это правда.
    '/uslugi': { status: 301, destination: '/etapy/' },
    '/uslugi/': { status: 301, destination: '/etapy/' },
    '/geo': { status: 301, destination: '/seysmozony/' },
    '/geo/': { status: 301, destination: '/seysmozony/' },
  },
});
