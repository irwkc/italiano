export type A1Chapter = {
  number: number;
  slug: string;
  title: string;
  /** Stored on the activity and used as the dashboard section. */
  label: string;
  focuses: readonly string[];
};

export const A1_CHAPTERS: readonly A1Chapter[] = [
  {
    number: 1,
    slug: "primi-contatti",
    title: "Primi contatti",
    label: "1. Primi contatti",
    focuses: ["saluti", "fonetica", "grammatica", "numeri"],
  },
  {
    number: 2,
    slug: "io-e-gli-altri",
    title: "Io e gli altri",
    label: "2. Io e gli altri",
    focuses: ["dati", "verbi", "articoli", "domande"],
  },
  {
    number: 3,
    slug: "buon-appetito",
    title: "Buon appetito!",
    label: "3. Buon appetito!",
    focuses: ["ristorante", "verbi", "plurale", "lessico"],
  },
  {
    number: 4,
    slug: "tempo-libero",
    title: "Tempo libero",
    label: "4. Tempo libero",
    focuses: ["hobby", "verbi", "piace", "calendario"],
  },
  {
    number: 5,
    slug: "in-albergo",
    title: "In albergo",
    label: "5. In albergo",
    focuses: ["hotel", "esserci", "interni", "modali"],
  },
  {
    number: 6,
    slug: "tanti-auguri",
    title: "Tanti auguri!",
    label: "6. Tanti auguri!",
    focuses: ["feste", "riflessivi", "possessivi", "pronuncia"],
  },
  {
    number: 7,
    slug: "in-giro-in-citta",
    title: "In giro in città",
    label: "7. In giro in città",
    focuses: ["strada", "partitivo", "andarci", "modali"],
  },
  {
    number: 8,
    slug: "italia-da-scoprire",
    title: "Italia da scoprire",
    label: "8. Italia da scoprire",
    focuses: ["passato", "participio", "meteo", "superlativo"],
  },
  {
    number: 9,
    slug: "sapori-ditalia",
    title: "Sapori d'Italia",
    label: "9. Sapori d'Italia",
    focuses: ["spesa", "pronomi", "impersonale", "quantita"],
  },
  {
    number: 10,
    slug: "la-famiglia",
    title: "La famiglia",
    label: "10. La famiglia",
    focuses: ["parenti", "possessivi", "passato", "cultura"],
  },
];

export function chapterByNumber(number: number) {
  const found = A1_CHAPTERS.find((chapter) => chapter.number === number);
  if (!found) throw new Error(`Unknown A1 chapter ${number}`);
  return found;
}
