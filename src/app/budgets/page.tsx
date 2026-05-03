import { BadgeDollarSign, Target, WalletCards } from "lucide-react";
import { upsertBudgetAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { BudgetProgress } from "@/components/budget-progress";
import { EmptyState } from "@/components/empty-state";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { requireCouple } from "@/lib/auth/context";
import { categoryBudget, sumExpenses } from "@/lib/expenses/summary";
import { formatCurrency, monthLabel, monthStart, nextMonthStart } from "@/lib/utils";
import { categories, type BudgetRow, type ExpenseRow } from "@/types/app";

export const metadata = {
  title: "Metas por categoria",
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, couple, members, currentMember, userCouples } = await requireCouple();
  const { error } = await searchParams;
  const start = monthStart();
  const end = nextMonthStart();
  const [{ data: budgets }, { data: expenses }] = await Promise.all([
    supabase.from("budgets").select("*").eq("couple_id", couple.id).eq("month", start),
    supabase.from("expenses").select("*").eq("couple_id", couple.id).gte("expense_date", start).lt("expense_date", end),
  ]);

  const rows = (budgets ?? []) as BudgetRow[];
  const monthExpenses = (expenses ?? []) as ExpenseRow[];
  const categoryRows = rows.filter((budget) => budget.scope === "category");
  const total = sumExpenses(monthExpenses);

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
              <Target size={14} />
              Metas por categoria
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Ajusta os tetos por categoria
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                Aqui vocês definem e acompanham os limites por categoria sem depender de uma meta geral do mês.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">{monthLabel(start)}</span>
              <span className="surface-chip">
                <WalletCards size={14} />
                {formatCurrency(total)}
              </span>
              <span className="surface-chip">
                <BadgeDollarSign size={14} />
                {categoryRows.length ? `${categoryRows.length} metas ativas` : "Sem metas salvas"}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Resumo rápido
              </p>
              <p className="mt-2 text-3xl font-black text-white">{formatCurrency(total)}</p>
              <p className="mt-1 text-sm font-medium text-white/72">Gasto total acumulado no mês.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Lançamentos
                </p>
                <p className="mt-2 text-xl font-black text-white">{monthExpenses.length}</p>
                <p className="mt-1 text-sm font-medium text-white/72">no mês atual</p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Metas salvas
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {categoryRows.length}
                </p>
                <p className="mt-1 text-sm font-medium text-white/72">metas por categoria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Gasto do mês"
          value={formatCurrency(total)}
          hint="O que já foi embora"
          tone="green"
          icon={<WalletCards size={18} />}
        />
        <SummaryCard
          label="Metas por categoria"
          value={String(categoryRows.length)}
          hint={categoryRows.length ? "Categorias acompanhadas" : "Defina uma meta para começar"}
          icon={<Target size={18} />}
        />
        <SummaryCard
          label="Lançamentos"
          value={String(monthExpenses.length)}
          hint="Movimentações no mês"
          tone="purple"
          icon={<BadgeDollarSign size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-title">Configurar metas</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Ajusta o limite por categoria</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                Escolhe uma categoria e define o teto que faz sentido para o mês.
              </p>
            </div>
          </div>

          <form action={upsertBudgetAction} className="mt-5 grid gap-4">
            <input type="hidden" name="month" value={start} />
            <Field label="Categoria">
              <Select name="category" defaultValue="Alimentação">
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </Field>
            <Field label="Meta da categoria">
              <Input name="amount" inputMode="decimal" placeholder="600,00" required />
            </Field>
            {error ? (
              <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>
            ) : null}
            <Button type="submit" className="justify-between">
              Salvar meta
              <BadgeDollarSign size={16} />
            </Button>
          </form>
        </section>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-title">Acompanhamento</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Onde cada categoria está indo</h2>
            </div>
            <p className="text-xs font-bold text-muted">{categoryRows.length} metas salvas</p>
          </div>
          <div className="mt-5 grid gap-3">
            {categories.map((category) => {
              const budget = categoryBudget(categoryRows, category);
              if (!budget) return null;
              const spent = monthExpenses
                .filter((expense) => expense.category === category)
                .reduce((sum, expense) => sum + Number(expense.amount), 0);
              return <BudgetProgress key={category} label={category} spent={spent} budget={Number(budget.amount)} />;
            })}
            {!categoryRows.length ? (
              <EmptyState title="Sem metas por categoria">
                Crie a primeira meta para acompanhar os tetos do mês.
              </EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
