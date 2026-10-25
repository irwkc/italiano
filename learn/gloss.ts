export const GLOSS: Record<string, string> = {
  a: "в / к",
  al: "в / к (al)",
  alle: "в / к (alle)",
  amico: "друг",
  andare: "идти / ехать",
  anna: "Анна",
  avere: "иметь",
  bene: "хорошо",
  biciclette: "велосипеды",
  buono: "вкусный / хороший",
  caffè: "кофе",
  casa: "дом",
  chiede: "спрашивает",
  cinema: "кино",
  città: "город",
  colazione: "завтрак",
  come: "как",
  completa: "заполни",
  con: "с",
  cosa: "что",
  di: "из / дома",
  domani: "завтра",
  dove: "где",
  due: "два",
  e: "и",
  ogni: "каждый",
  spazio: "пропуск",
  è: "есть / является",
  esco: "выхожу",
  essere: "быть",
  film: "фильм",
  giusto: "правильный",
  il: "определённый артикль",
  in: "в",
  io: "я",
  italia: "Италия",
  italiano: "итальянец / итальянский",
  la: "определённый артикль",
  marco: "Марко",
  mattina: "утро",
  mia: "моя",
  noi: "мы",
  o: "или",
  per: "для / чтобы",
  parola: "слово",
  poi: "потом",
  posto: "место",
  prendi: "берёшь / заказываешь",
  qualcuno: "кто-то",
  rispondi: "отвечаешь",
  rossa: "красная",
  routine: "распорядок",
  saluti: "приветствия / ты здороваешься",
  sette: "семь",
  stai: "ты (как дела)",
  stasera: "сегодня вечером",
  strada: "улица",
  sveglio: "просыпаюсь",
  una: "одна / неопределённый артикль",
  un: "один / неопределённый артикль",
  vedere: "видеть / смотреть",
  venire: "приходить",
  verbo: "глагол",
  vespa: "веспа",
};

export function glossKey(word: string) {
  return word.toLocaleLowerCase("it-IT").normalize("NFC");
}

export function lookupGloss(word: string) {
  return GLOSS[glossKey(word)] ?? null;
}

export function splitWords(text: string) {
  return text.split(/([A-Za-zÀ-ÖØ-öø-ÿ]+)/).filter((part) => part.length > 0);
}

export function isWord(part: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(part);
}
