import { Suspense } from "react";

export function AulaFallback() {
  return <div className="aula-shell" aria-busy="true" />;
}

export function Dynamic({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AulaFallback />}>{children}</Suspense>;
}
