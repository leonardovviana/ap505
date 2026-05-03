import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { createCoupleAction, joinCoupleAction } from "@/app/actions";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { requireUser } from "@/lib/auth/context";

const hints = [
  "cria o casal em menos de um minuto",
  "entra com o código sem enrolação",
  "começa a lançar e o resto se organiza sozinho",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <AppLogo />

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)]">
          <div className="hero-panel rounded-[8px] p-6 md:p-8">
            <div className="relative z-10 space-y-6">
              <span className="surface-chip">Começando</span>
              <div className="max-w-2xl space-y-3">
                <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                  Primeiro, vamos juntar vocês no mesmo cantinho.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                  Crie um casal e mande o código, ou entre com o convite que já recebeu.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hints.map((hint) => (
                  <span key={hint} className="surface-chip">
                    <CheckCircle2 size={14} />
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="soft-card rounded-[8px] p-5 md:p-6">
            <p className="section-title">Resumo rápido</p>
            <h2 className="mt-3 text-2xl font-black tracking-normal text-[#111827]">
              Tudo que vocês precisam para começar.
            </h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-[8px] bg-ap-mint px-4 py-3 text-sm font-bold text-[#111827] ring-1 ring-emerald-100">
                Cria um casal ou entra por convite
              </div>
              <div className="rounded-[8px] bg-ap-lilac px-4 py-3 text-sm font-bold text-[#111827] ring-1 ring-violet-100">
                gastos e metas em tempo real
              </div>
              <div className="rounded-[8px] bg-white px-4 py-3 text-sm font-bold text-[#111827] ring-1 ring-black/5">
                sem plano, sem limite, sem confusão
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-[8px] bg-[#111827] px-4 py-3 text-white">
              <Sparkles size={18} className="text-ap-green" />
              <p className="text-sm font-semibold">Privado. Leve. Feito para os dois.</p>
            </div>
          </aside>
        </section>

        {error ? <p className="mt-4 rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <form action={createCoupleAction} className="soft-card overflow-hidden rounded-[8px] p-5">
            <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
            <h2 className="text-xl font-black text-[#111827]">Criar casal</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-muted">
              Você gera o código e a outra pessoa entra depois.
            </p>
            <div className="mt-5 grid gap-4">
              <Field label="Nome do cantinho">
                <Input name="couple_name" placeholder="AP505, Casa 12, Amor & Conta..." required />
              </Field>
              <Field label="Como você quer aparecer?">
                <Input name="display_name" placeholder="Leonardo" required />
              </Field>
              <Button type="submit" className="justify-between">
                Criar casal
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>

          <form action={joinCoupleAction} className="soft-card overflow-hidden rounded-[8px] p-5">
            <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
            <h2 className="text-xl font-black text-[#111827]">Entrar com código</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-muted">
              Recebeu o convite? Cola aqui e pronto.
            </p>
            <div className="mt-5 grid gap-4">
              <Field label="Código">
                <Input name="invite_code" placeholder="A1B2C3D4" required />
              </Field>
              <Field label="Como você quer aparecer?">
                <Input name="display_name" placeholder="Isabela" required />
              </Field>
              <Button type="submit" className="justify-between">
                Entrar no casal
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
