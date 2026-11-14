import { lookupGloss } from "@/learn/gloss";
import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiError, apiOk, clientIp } from "@/learn/mobile/http";
import { rateLimit } from "@/learn/rate-limit";

const cache = new Map<string, string>();

export async function GET(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  const limited = rateLimit(`mobile-gloss:${clientIp(request)}`, 60, 60_000);
  if (!limited.ok) {
    return apiError(429, "rate_limited", "Слишком часто.");
  }

  const word = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!word) return apiOk({ text: "" });

  const local = lookupGloss(word);
  if (local) return apiOk({ text: local });

  const key = word.toLocaleLowerCase("it-IT");
  const hit = cache.get(key);
  if (hit) return apiOk({ text: hit });

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=it|ru`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const text = data.responseData?.translatedText?.trim() || "нет перевода";
    cache.set(key, text);
    return apiOk({ text });
  } catch {
    return apiOk({ text: "нет перевода" });
  }
}
