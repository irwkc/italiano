import { operator } from "@/lib/legal";

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${operator.sites[0]}/#giacomo`,
      name: "Giacomo Schiavon",
      alternateName: ["Джакомо Скиавон", "Джакомо Скьявон", "Giacomo", "ita.giacomo"],
      url: operator.sites[0],
      sameAs: [operator.telegram, operator.instagram, operator.sites[1]],
      jobTitle: "Преподаватель итальянского",
      knowsLanguage: ["it", "ru"],
      birthPlace: { "@type": "Place", name: "Novara, Italia" },
      description:
        "Джакомо Скиавон (Giacomo Schiavon) — носитель итальянского из Новары. Онлайн-уроки итальянского для русскоязычных.",
    },
    {
      "@type": "WebSite",
      "@id": `${operator.sites[0]}/#site`,
      url: operator.sites[0],
      name: "Giacomo Schiavon — итальянский с носителем",
      alternateName: ["Джакомо Скиавон", "Giacomo Italiano", "ita.giacomo"],
      inLanguage: "ru",
      publisher: { "@id": `${operator.sites[0]}/#giacomo` },
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
