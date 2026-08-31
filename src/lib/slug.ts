// Волна 11: единый slugify для ToC id-slug и якорной навигации без JS.
// Юникод: сохраняем кириллицу (HTML5 разрешает буквенно-цифровые id, современные
// браузеры корректно скроллят к якорям с процент-кодированной кириллицей).
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[«»"'“”„‟]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
