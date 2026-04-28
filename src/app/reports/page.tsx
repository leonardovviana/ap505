import { BarChart3, BadgeDollarSign, UsersRound, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { SpendingChart } from "@/components/spending-chart";
import { SummaryCard } from "@/components/summary-card";
import { requireCouple } from "@/lib/auth/context";
import { dominantCategory, expensesByCategory, expensesByMember, sumExpenses } from "@/lib/expenses/summary";
import { formatCurrency, monthLabel, monthStart, nextMonthStart } from "@/lib/utils";
import type { ExpenseRow } from "@/types/app";

export const metadata = {
  title: "Relatórios",
};

export default async function ReportsPage() {
  const { supabase, couple, members } = await requireCouple();
  const start = monthStart();
  const end = nextMonthStart();
  const { data } = await supabase
    .from("expenses")
    .select("*, couple_members(display_name)")
    .eq("couple_id", couple.id)
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false });

  const expenses = (data ?? []) as ExpenseRow[];
  const total = sumExpenses(expenses);
  const byCategory = expensesByCategory(expenses);
  const byMember = expensesByMember(expenses, members);
  const topCategory = dominantCategory(expenses);

  return (
    <AppShell coupleId={couple.id} members={members}>
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <BarChart3 size={14} />
              Relatórios
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Esse mês alimentação dominou?
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {topCategory
                  ? `${topCategory} tá puxando ${monthLabel(start)} para cima.`
                  : "Ainda sem dados suficientes. Lança alguns gastos e o retrato aparece aqui."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">{monthLabel(start)}</span>
              <span className="surface-chip">
                <BadgeDollarSign size={14} />
                {topCategory ?? "Sem categoria"}
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Resumo do mês
              </p>
              <p className="mt-2 text-3xl font-black text-white">{formatCurrency(total)}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                {topCategory ? `A categoria líder é ${topCategory.toLowerCase()}.` : "Sem categoria líder ainda."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {byMember.map((item) => (
                <div key={item.name} className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                    {item.name}
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{formatCurrency(item.value)}</p>
                  <p className="mt-1 text-sm font-medium text-white/72">gasto no mês</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total do mês"
          value={formatCurrency(total)}
          hint="Tudo que entrou no mês atual"
          tone="green"
          icon={<WalletCards size={18} />}
        />
        {byMember.map((item, index) => (
          <SummaryCard
            key={item.name}
            label={item.name}
            value={formatCurrency(item.value)}
            hint={index === 0 ? "Primeiro membro" : "Segundo membro"}
            tone={index === 0 ? "purple" : "white"}
            icon={<UsersRound size={18} />}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Por categoria</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Mapa visual do mês</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111827] ring-1 ring-black/5">
              {monthLabel(start)}
            </p>
          </div>
          <div className="mt-5">
            <SpendingChart data={byCategory} />
          </div>
        </section>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Detalhes</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Onde a grana foi</h2>
            </div>
            <p className="text-xs font-bold text-muted">{byCategory.length} categorias</p>
          </div>
          <div className="mt-5 grid gap-3">
            {byCategory.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-[8px] bg-white/80 px-4 py-3 ring-1 ring-black/5"
              >
                <span className="text-sm font-black text-[#111827]">{item.name}</span>
                <span className="text-sm font-black text-[#111827]">{formatCurrency(item.value)}</span>
              </div>
            ))}
            {!byCategory.length ? (
              <EmptyState title="Sem relatório">Lança alguns gastos e volta aqui.</EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
