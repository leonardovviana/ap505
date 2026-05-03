import { MessageSquareQuote, Wand2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChatExpenseInput } from "@/components/chat-expense-input";
import { EmptyState } from "@/components/empty-state";
import { ExpenseCard } from "@/components/expense-card";
import { IncomeCard } from "@/components/income-card";
import { requireCouple } from "@/lib/auth/context";
import type { ExpenseRow, IncomeRow } from "@/types/app";

export const metadata = {
  title: "Chat",
};

type RecentEntry =
  | { type: "expense"; created_at: string; entry: ExpenseRow }
  | { type: "income"; created_at: string; entry: IncomeRow };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, couple, members, currentMember, userCouples } = await requireCouple();
  const { error } = await searchParams;
  const [{ data: expensesData }, { data: incomesData }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, couple_members(display_name)")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("incomes")
      .select("*, couple_members(display_name)")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const expenses = (expensesData ?? []) as ExpenseRow[];
  const incomes = (incomesData ?? []) as IncomeRow[];
  const entries: RecentEntry[] = [
    ...expenses.map((entry) => ({ type: "expense" as const, created_at: entry.created_at, entry })),
    ...incomes.map((entry) => ({ type: "income" as const, created_at: entry.created_at, entry })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <AppShell
      coupleId={couple.id}
      coupleName={couple.name}
      members={members}
      currentMemberId={currentMember?.id}
      userCouples={userCouples}
    >
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <MessageSquareQuote size={14} />
              Chat inteligente
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Escreve natural que eu organizo.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                O app entende gastos e entradas, mostra o preview e só salva quando você confirma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">“5,00 coxinha”</span>
              <span className="surface-chip">“gastei 42 no mercado”</span>
              <span className="surface-chip">“recebi 3500 salário”</span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Como funciona
              </p>
              <p className="mt-2 text-xl font-black text-white">Confere antes de salvar</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                Se algo saiu errado, ajusta a frase antes de confirmar.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  IA + fallback
                </p>
                <p className="mt-2 text-sm font-semibold text-white/90">Gemini tenta, parser local segura.</p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Apagar
                </p>
                <p className="mt-2 text-sm font-semibold text-white/90">Errou? Remove o lançamento na hora.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <ChatExpenseInput />

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-title">Últimos lançados</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">O que acabou de virar registro</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-ap-lilac text-ap-purple ring-1 ring-violet-100">
              <Wand2 size={18} />
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {entries.map((item) =>
              item.type === "income" ? (
                <IncomeCard key={`income-${item.entry.id}`} income={item.entry} canDelete returnTo="/chat" />
              ) : (
                <ExpenseCard key={`expense-${item.entry.id}`} expense={item.entry} canDelete returnTo="/chat" />
              ),
            )}
            {!entries.length ? (
              <EmptyState title="Chat zerado">
                Tenta “5,00 coxinha” ou “recebi 3500 salário” e confirma o preview.
              </EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
