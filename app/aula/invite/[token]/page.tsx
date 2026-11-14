import { connection } from "next/server";
import { hashToken } from "@/learn/crypto";
import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { InviteForm } from "./form";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Dynamic>
      <InviteGate params={params} />
    </Dynamic>
  );
}

async function InviteGate({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const store = await readStore();
  const invite = store.invites.find((item) => item.tokenHash === hashToken(token));
  // Request time after connection() — needed to judge invite expiry.
  // eslint-disable-next-line react-hooks/purity -- dynamic request boundary
  const now = Date.now();
  const expired = !invite || invite.usedAt || new Date(invite.expiresAt).getTime() < now;

  return (
    <div className="aula-login">
      {expired || !invite ? (
        <div className="aula-login-card">
          <h1>Aula</h1>
          <p className="aula-err">Ссылка устарела или уже использована. Попросите новое приглашение.</p>
        </div>
      ) : (
        <InviteForm token={token} />
      )}
    </div>
  );
}
