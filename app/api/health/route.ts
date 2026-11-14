import { poolConfigured, readStoreHealthy } from "@/learn/data/health";

/**
 * App liveness / config presence (never returns secret values).
 */
export async function GET() {
  const smtp =
    Boolean(process.env.SMTP_USER) && Boolean(process.env.SMTP_PASS) && Boolean(process.env.SMTP_HOST);
  const sessionSecret = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
  const aulaPassword = Boolean(process.env.AULA_PASSWORD);
  const appUrl = Boolean(process.env.APP_URL);
  const database = poolConfigured();

  let storeOk = false;
  let storeError: string | null = null;
  try {
    storeOk = await readStoreHealthy();
  } catch (error) {
    storeError = error instanceof Error ? error.message : "store_error";
  }

  const ok = storeOk && database;
  return Response.json(
    {
      ok,
      checks: {
        database,
        store: storeOk,
        sessionSecret,
        aulaPassword,
        appUrl,
        smtp,
      },
      ...(storeError ? { storeError } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
