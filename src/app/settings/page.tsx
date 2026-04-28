import { Copy, KeyRound, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { AvatarUpload } from "@/components/avatar-upload";
import { PushNotificationButton } from "@/components/push-notification-button";
import { Button } from "@/components/ui/button";
import { requireCouple } from "@/lib/auth/context";

export const metadata = {
  title: "Ajustes",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, profile, couple, members } = await requireCouple();
  const { error } = await searchParams;

  return (
    <AppShell coupleId={couple.id} members={members}>
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <ShieldCheck size={14} />
              Privado
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Deixa o AP505 com a cara de vocês.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                Ajusta nome, foto, convite e notificações sem perder a leveza. Tudo fica no mesmo clima do resto do app.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">{profile?.full_name ?? "Seu perfil"}</span>
              <span className="surface-chip">{couple.name}</span>
              <span className="surface-chip">{members.length} pessoas</span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Código do casal
              </p>
              <p className="mt-2 text-3xl font-black tracking-[0.16em] text-white">{couple.invite_code}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                Manda esse código para a outra pessoa entrar no AP505.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                    {member.role === "owner" ? "Quem criou" : "Parceiro"}
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{member.display_name}</p>
                  <p className="mt-1 text-sm font-medium text-white/72">
                    {member.role === "owner" ? "Tem o código na mão" : "Já tá dentro do casal"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <AvatarUpload userId={user.id} fullName={profile?.full_name ?? ""} avatarUrl={profile?.avatar_url} />

        <div className="grid gap-4">
          <section className="soft-card overflow-hidden rounded-[8px] p-5">
            <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-title">Convite</p>
                <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Compartilha sem enrolação</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">
                  O código permite entrar no casal sem expor nada além do necessário.
                </p>
              </div>
              <div className="rounded-[8px] bg-[linear-gradient(135deg,rgba(29,185,84,0.12),rgba(130,10,209,0.14))] p-3 text-[#111827] ring-1 ring-black/5">
                <KeyRound size={18} />
              </div>
            </div>
            <div className="mt-5 rounded-[8px] bg-white px-4 py-3 text-center text-xl font-black tracking-[0.24em] text-[#111827] ring-1 ring-black/5">
              {couple.invite_code}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs font-bold text-muted">
              <Copy size={14} /> Copia manualmente por enquanto, sem firula.
            </p>
          </section>

          <PushNotificationButton />

          <form action={signOutAction} className="soft-card overflow-hidden rounded-[8px] p-5">
            <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
            <h2 className="text-2xl font-black tracking-normal text-[#111827]">Sair da conta</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">
              Sai só da sessão atual. O casal continua intacto.
            </p>
            <Button variant="danger" className="mt-5 w-full">
              Sair da conta
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
