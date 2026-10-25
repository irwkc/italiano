import { lookupGloss } from "@/learn/gloss";

const cache = new Map<string, string>();

export async function GET(request: Request) {
  const word = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!word) return Response.json({ text: "" });
  const local = lookupGloss(word);
  if (local) return Response.json({ text: local });
  const key = word.toLocaleLowerCase("it-IT");
  const hit = cache.get(key);
  if (hit) return Response.json({ text: hit });

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=it|ru`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const text = data.responseData?.translatedText?.trim() || "нет перевода";
    cache.set(key, text);
    return Response.json({ text });
  } catch {
    return Response.json({ text: "нет перевода" });
  }
}
