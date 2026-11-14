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
  const { token } = await params;
  const store = await readStore();
  const invite = store.invites.find((item) => item.tokenHash === hashToken(token));
  const expired = !invite || invite.usedAt || new Date(invite.expiresAt).getTime() < Date.now();

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
