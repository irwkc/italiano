import { Suspense } from "react";

export function AulaFallback() {
  return (
    <div className="aula-shell aula-fallback" aria-busy="true">
      <p className="aula-kicker">Aula</p>
      <p className="aula-muted">Caricamento…</p>
    </div>
  );
}

export function Dynamic({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AulaFallback />}>{children}</Suspense>;
}
