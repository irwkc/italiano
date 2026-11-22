export type A1Focus = {
  /** Stable key used in the catalog source. */
  key: string;
  /** Section label stored on the activity as `topic`. */
  topic: string;
};

export type A1Chapter = {
  number: number;
  slug: string;
  /** `chapter.title` in the store. The UI adds «Глава N» itself. */
  title: string;
  focuses: readonly A1Focus[];
};

export const A1_CHAPTERS: readonly A1Chapter[] = [
  {
    number: 1,
    slug: "primi-contatti",
    title: "Primi contatti",
    focuses: [
      { key: "saluti", topic: "Приветствия и знакомство" },
      { key: "fonetica", topic: "Фонетика и алфавит" },
      { key: "grammatica", topic: "Базовая грамматика" },
      { key: "numeri", topic: "Первые числительные" },
    ],
  },
  {
    number: 2,
    slug: "io-e-gli-altri",
    title: "Io e gli altri",
    focuses: [
      { key: "dati", topic: "Личные данные и профессии" },
      { key: "verbi", topic: "Глаголы I группы и правильные формы" },
      { key: "articoli", topic: "Артикли и отрицание" },
      { key: "domande", topic: "Вопросительные слова и числа" },
    ],
  },
  {
    number: 3,
    slug: "buon-appetito",
    title: "Buon appetito!",
    focuses: [
      { key: "ristorante", topic: "Заказ в ресторане и баре" },
      { key: "verbi", topic: "Глаголы II группы и модальность" },
      { key: "plurale", topic: "Множественное число и артикли" },
      { key: "lessico", topic: "Гастрономический лексикон" },
    ],
  },
  {
    number: 4,
    slug: "tempo-libero",
    title: "Tempo libero",
    focuses: [
      { key: "hobby", topic: "Хобби и предпочтения" },
      { key: "verbi", topic: "Глаголы III группы и движения" },
      { key: "piace", topic: "Конструкция mi piace / mi piacciono" },
      { key: "calendario", topic: "Дни недели и время" },
    ],
  },
  {
    number: 5,
    slug: "in-albergo",
    title: "In albergo",
    focuses: [
      { key: "hotel", topic: "Бронирование и жилье" },
      { key: "esserci", topic: "Оборот c'è / ci sono и сочлененные предлоги" },
      { key: "interni", topic: "Описание интерьера и даты" },
      { key: "modali", topic: "Модальные глаголы умения и возможности" },
    ],
  },
  {
    number: 6,
    slug: "tanti-auguri",
    title: "Tanti auguri!",
    focuses: [
      { key: "feste", topic: "Праздники и распорядок дня" },
      { key: "riflessivi", topic: "Возвратные глаголы" },
      { key: "possessivi", topic: "Притяжательные местоимения" },
      { key: "pronuncia", topic: "Правила произношения" },
    ],
  },
  {
    number: 7,
    slug: "in-giro-in-citta",
    title: "In giro in città",
    focuses: [
      { key: "strada", topic: "Ориентация в городе" },
      { key: "partitivo", topic: "Частичный артикль и городская навигация" },
      { key: "andarci", topic: "Глагол andare с частицей ci" },
      { key: "modali", topic: "Модальные глаголы в городе" },
    ],
  },
  {
    number: 8,
    slug: "italia-da-scoprire",
    title: "Italia da scoprire",
    focuses: [
      { key: "passato", topic: "Прошедшее время (Passato prossimo)" },
      { key: "participio", topic: "Причастия и вспомогательные глаголы" },
      { key: "meteo", topic: "Погода и причастия" },
      { key: "superlativo", topic: "Абсолютный превосходный градус" },
    ],
  },
  {
    number: 9,
    slug: "sapori-ditalia",
    title: "Sapori d'Italia",
    focuses: [
      { key: "spesa", topic: "Покупки и кулинария" },
      { key: "pronomi", topic: "Прямые местоимения и частица NE" },
      { key: "impersonale", topic: "Безличная конструкция (Si impersonale)" },
      { key: "quantita", topic: "Упаковки и меры веса" },
    ],
  },
  {
    number: 10,
    slug: "la-famiglia",
    title: "La famiglia",
    focuses: [
      { key: "parenti", topic: "Семья и родственники" },
      { key: "possessivi", topic: "Притяжательные местоимения с родственниками" },
      { key: "passato", topic: "Прошедшее время возвратных глаголов" },
      { key: "cultura", topic: "Итальянские жесты и относительная степень" },
    ],
  },
];

export function chapterByNumber(number: number) {
  const found = A1_CHAPTERS.find((chapter) => chapter.number === number);
  if (!found) throw new Error(`Unknown A1 chapter ${number}`);
  return found;
}

export function topicFor(chapterNumber: number, focus: string) {
  const topic = chapterByNumber(chapterNumber).focuses.find((item) => item.key === focus)?.topic;
  if (!topic) throw new Error(`Unknown focus ${focus} in chapter ${chapterNumber}`);
  return topic;
}
