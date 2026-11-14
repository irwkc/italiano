import { readStore } from "@/learn/data/store";

export function poolConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function readStoreHealthy() {
  const store = await readStore();
  return Boolean(store?.teacher?.id);
}
