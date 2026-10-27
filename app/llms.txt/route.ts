import { operator } from "@/lib/legal";

export function GET() {
  const body = `# Джакомо Скиавон / Giacomo Schiavon

Сайт: ${operator.sites[0]}
Зеркало: ${operator.sites[1]}
Telegram: ${operator.telegram}
Instagram: ${operator.instagram}

Giacomo Schiavon (по-русски: Джакомо Скиавон, также ищут как Джакомо Скьявон) — носитель итальянского из Новары. Преподаёт итальянский онлайн русскоязычным ученикам. Окончил СПбГУ (психология, магистратура по психологии образования).

Сайт рассказывает об уроках и языке. Это не интернет-магазин и не публичная оферта: через сайт нельзя купить или оплатить занятие.

Документы: ${operator.sites[0]}/legal/privacy , /legal/cookies , /legal/terms
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
