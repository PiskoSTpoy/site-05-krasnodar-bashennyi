// Волна 16: единый реестр этапов жизненного цикла крана.
// Используется полосой навигации по этапам (StageStrip) и связками «предыдущий /
// следующий этап», чтобы порядок этапов задавался в одном месте, а не переписывался
// руками на каждой странице.
export interface Stage {
  slug: string;
  href: string;
  num: string;
  short: string;
  name: string;
}

export const stages: Stage[] = [
  { slug: 'izyskaniya-i-grunt', href: '/etapy/izyskaniya-i-grunt/', num: '01', short: 'Изыскания', name: 'Изыскания и грунт' },
  { slug: 'proekt-i-ppr', href: '/etapy/proekt-i-ppr/', num: '02', short: 'Проект и ППР', name: 'Проект и ППР' },
  { slug: 'montazh-i-ankerovka', href: '/etapy/montazh-i-ankerovka/', num: '03', short: 'Монтаж', name: 'Монтаж и анкеровка' },
  { slug: 'ekspluatatsiya-i-tishina', href: '/etapy/ekspluatatsiya-i-tishina/', num: '04', short: 'Эксплуатация', name: 'Эксплуатация и режим тишины' },
  { slug: 'demontazh-i-perebazirovka', href: '/etapy/demontazh-i-perebazirovka/', num: '05', short: 'Демонтаж', name: 'Демонтаж и перебазировка' },
];
