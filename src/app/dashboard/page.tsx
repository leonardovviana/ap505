import { Banknote, BadgeDollarSign, CircleDollarSign, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BudgetProgress } from "@/components/budget-progress";
import { EmptyState } from "@/components/empty-state";
import { ExpenseCard } from "@/components/expense-card";
import { SpendingChart } from "@/components/spending-chart";
import { SummaryCard } from "@/components/summary-card";
import { requireCouple } from "@/lib/auth/context";
import { dominantCategory, expensesByCategory, expensesByMember, monthlyBudget, sumExpenses } from "@/lib/expenses/summary";
import { dominantIncomeKind, incomesByKind, incomesByMember, sumIncomes } from "@/lib/incomes/summary";
import { formatCurrency, monthLabel, monthStart, nextMonthStart } from "@/lib/utils";
import { incomeKindLabels } from "@/types/app";
import type { BudgetRow, ExpenseRow, IncomeRow } from "@/types/app";

export const metadata = {
  title: "Resumo do casal",
};

export default async function DashboardPage() {
  const { supabase, couple, members } = await requireCouple();
  const start = monthStart();
  const end = nextMonthStart();

  const [{ data: expenses }, { data: incomes }, { data: budgets }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, couple_members(display_name)")
      .eq("couple_id", couple.id)
      .gte("expense_date", start)
      .lt("expense_date", end)
      .order("expense_date", { ascending: false })
      .limit(50),
    supabase
      .from("incomes")
      .select("*, couple_members(display_name)")
      .eq("couple_id", couple.id)
      .gte("income_date", start)
      .lt("income_date", end)
      .order("income_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("budgets").select("*").eq("couple_id", couple.id).eq("month", start),
  ]);

  const monthExpenses = (expenses ?? []) as ExpenseRow[];
  const monthIncomes = (incomes ?? []) as IncomeRow[];
  const monthBudgets = (budgets ?? []) as BudgetRow[];

  const totalExpenses = sumExpenses(monthExpenses);
  const totalIncome = sumIncomes(monthIncomes);
  const balance = totalIncome - totalExpenses;
  const byCategory = expensesByCategory(monthExpenses);
  const byExpenseMember = expensesByMember(monthExpenses, members);
  const byIncomeMember = incomesByMember(monthIncomes, members);
  const byIncomeKind = incomesByKind(monthIncomes);
  const topCategory = dominantCategory(monthExpenses);
  const topIncomeKind = dominantIncomeKind(monthIncomes);
  const budget = monthlyBudget(monthBudgets);
  const leadingIncomeMember = [...byIncomeMember].sort((a, b) => b.value - a.value)[0];
  const leadingExpenseMember = [...byExpenseMember].sort((a, b) => b.value - a.value)[0];
  const latestIncome = monthIncomes[0];

  return (
    <AppShell coupleId={couple.id} members={members}>
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <Banknote size={14} />
              Resumo do casal
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Vocês receberam {formatCurrency(totalIncome)} e gastaram {formatCurrency(totalExpenses)} esse mês
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {balance >= 0
                  ? `Sobrou ${formatCurrency(balance)} depois das saídas.`
                  : `Faltam ${formatCurrency(Math.abs(balance))} para fechar o mês.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">
                <Banknote size={14} />
                {formatCurrency(totalIncome)} em entradas
              </span>
              <span className="surface-chip">
                <CircleDollarSign size={14} />
                {formatCurrency(totalExpenses)} em saídas
              </span>
              <span className="surface-chip">
                <BadgeDollarSign size={14} />
                {topCategory ?? "Sem categoria"}
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                {byIncomeKind.map((item) => `${item.label}: ${formatCurrency(item.value)}`).join(" · ") ||
                  "Sem entradas"}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">Saldo do mês</p>
              <p className="mt-2 text-3xl font-black text-white">{formatCurrency(balance)}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                {latestIncome ? `Última entrada: ${latestIncome.description}` : "Lança a primeira entrada e tudo começa a aparecer"}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                {topIncomeKind ? `Tipo dominante: ${incomeKindLabels[topIncomeKind]}` : "Sem entradas registradas"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  {leadingIncomeMember ? "Quem mais recebeu?" : "Sem dados"}
                </p>
                <p className="mt-2 text-xl font-black text-white">{leadingIncomeMember?.name ?? "Sem dados"}</p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {leadingIncomeMember ? formatCurrency(leadingIncomeMember.value) : "Primeira entrada define"}
                </p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  {leadingExpenseMember ? "Quem mais gastou?" : "Sem dados"}
                </p>
                <p className="mt-2 text-xl font-black text-white">{leadingExpenseMember?.name ?? "Sem dados"}</p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {leadingExpenseMember ? formatCurrency(leadingExpenseMember.value) : "Primeiro gasto define"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Entradas do mês"
          value={formatCurrency(totalIncome)}
          hint="Tudo que entrou na conta do casal"
          tone="green"
          icon={<Banknote size={18} />}
        />
        <SummaryCard
          label="Saídas do mês"
          value={formatCurrency(totalExpenses)}
          hint="Tudo que saiu da conta do casal"
          tone="purple"
          icon={<CircleDollarSign size={18} />}
        />
        <SummaryCard
          label="Saldo do mês"
          value={formatCurrency(balance)}
          hint={balance >= 0 ? "Fechou no positivo" : "Ainda falta cobrir as saídas"}
          tone={balance >= 0 ? "green" : "purple"}
          icon={<WalletCards size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="soft-card overflow-hidden rounded-[8px] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Categorias</p>
              <h2 className="mt-2 text-lg font-black text-[#111827]">Resumo visual do mês</h2>
            </div>
            <p className="text-xs font-bold text-muted">{monthLabel(start)}</p>
          </div>
          <SpendingChart data={byCategory} />
        </section>

        <section className="grid gap-4">
          {budget ? (
            <BudgetProgress label="Meta mensal" spent={totalExpenses} budget={Number(budget.amount)} />
          ) : (
            <EmptyState title="Sem meta mensal">Ainda não tem uma meta mensal cadastrada.</EmptyState>
          )}
          <div className="soft-card rounded-[8px] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="section-title">Últimos gastos</p>
                <h2 className="mt-2 text-lg font-black text-[#111827]">O que apareceu agora</h2>
              </div>
            </div>
            <div className="grid gap-3">
              {monthExpenses.slice(0, 4).map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
              {!monthExpenses.length ? (
                <EmptyState title="Nada lançado">Bora lançar o primeiro gasto?</EmptyState>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
