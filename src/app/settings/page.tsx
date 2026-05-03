import { Copy, KeyRound, PlusCircle, ShieldCheck } from "lucide-react";
import { createCoupleAction, joinCoupleAction, signOutAction, updateCoupleNameAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PushNotificationButton } from "@/components/push-notification-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { requireCouple } from "@/lib/auth/context";

export const metadata = {
  title: "Ajustes",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { couple, members, currentMember, userCouples } = await requireCouple();
  const { error } = await searchParams;

  return (
    <AppShell
      coupleId={couple.id}
      coupleName={couple.name}
      members={members}
      currentMemberId={currentMember?.id}
      userCouples={userCouples}
    >
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <ShieldCheck size={14} />
              Privado
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Ajustes de {couple.name}.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                Nome do casal, convite, novos casais e notificações ficam separados por cantinho.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">{couple.name}</span>
              <span className="surface-chip">{members.length} pessoas</span>
              <span className="surface-chip">{userCouples.length} casais na conta</span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Código do casal
              </p>
              <p className="mt-2 text-3xl font-black tracking-[0.16em] text-white">{couple.invite_code}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                Manda esse código para a outra pessoa entrar em {couple.name}.
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
                    {member.role === "owner" ? "Tem o código na mão" : "Já está dentro do casal"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <form action={updateCoupleNameAction} className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Nome do app</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Esse cantinho é de vocês</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                AP505 era só o nome do seu casal. Cada casal escolhe o próprio nome no header.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-ap-mint text-ap-green ring-1 ring-emerald-100">
              <PlusCircle size={18} />
            </span>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Nome do casal">
              <Input name="name" defaultValue={couple.name} placeholder="Casa 12, Amor & Conta, AP505..." required />
            </Field>
            <Button type="submit" className="justify-between">
              Salvar nome
              <PlusCircle size={16} />
            </Button>
          </div>
        </form>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Convite</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Compartilha sem enrolação</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                O código permite entrar só nesse casal. Outros casais continuam separados.
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
            <Copy size={14} /> Copia manualmente por enquanto.
          </p>
        </section>

        <PushNotificationButton />

        <form action={createCoupleAction} className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <h2 className="text-2xl font-black tracking-normal text-[#111827]">Criar outro casal</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-muted">
            Você pode ter outro cantinho separado. Gastos, entradas e relatórios não misturam.
          </p>
          <div className="mt-5 grid gap-4">
            <Field label="Nome do novo casal">
              <Input name="couple_name" placeholder="Casa da praia" required />
            </Field>
            <Field label="Como você quer aparecer nele?">
              <Input name="display_name" defaultValue={currentMember?.display_name ?? ""} placeholder="Seu nome" required />
            </Field>
            <Button type="submit" className="justify-between">
              Criar e trocar
              <PlusCircle size={16} />
            </Button>
          </div>
        </form>

        <form action={joinCoupleAction} className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <h2 className="text-2xl font-black tracking-normal text-[#111827]">Entrar em outro casal</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-muted">
            Use o código de convite. Ao entrar, esse casal vira o ativo no header.
          </p>
          <div className="mt-5 grid gap-4">
            <Field label="Código do convite">
              <Input name="invite_code" placeholder="A1B2C3D4" required />
            </Field>
            <Field label="Como você quer aparecer nele?">
              <Input name="display_name" defaultValue={currentMember?.display_name ?? ""} placeholder="Seu nome" required />
            </Field>
            <Button type="submit" className="justify-between">
              Entrar e trocar
              <PlusCircle size={16} />
            </Button>
          </div>
        </form>

        <form action={signOutAction} className="soft-card overflow-hidden rounded-[8px] p-5 lg:col-span-2">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <h2 className="text-2xl font-black tracking-normal text-[#111827]">Sair da conta</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-muted">
            Sai só da sessão atual. Seus casais continuam intactos.
          </p>
          <Button variant="danger" className="mt-5 w-full">
            Sair da conta
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
