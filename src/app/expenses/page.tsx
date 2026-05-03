import { CircleDollarSign, PlusCircle, Sparkles, UsersRound, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ExpenseCard } from "@/components/expense-card";
import { ExpenseForm } from "@/components/expense-form";
import { SummaryCard } from "@/components/summary-card";
import { Field, Select } from "@/components/ui/field";
import { requireCouple } from "@/lib/auth/context";
import {
  dominantCategory,
  expensesByMember,
  sumExpenses,
  sumFoodVoucherExpenses,
  sumSpendableExpenses,
} from "@/lib/expenses/summary";
import { sumFoodVoucherIncomes, sumSpendableIncomes } from "@/lib/incomes/summary";
import { formatCurrency, monthStart, nextMonthStart, monthLabel } from "@/lib/utils";
import { categories, type Category, type ExpenseRow, type IncomeRow } from "@/types/app";

export const metadata = {
  title: "Gastos",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; member?: string; category?: string; month?: string }>;
}) {
  const { supabase, couple, members, currentMember, userCouples } = await requireCouple();
  const { error, member, category, month } = await searchParams;
  const selectedMember = members.some((item) => item.id === member) ? member : "";
  const selectedCategory = categories.includes(category as Category) ? (category as Category) : "";
  const selectedMonth = /^\d{4}-\d{2}-01$/.test(month ?? "") ? month! : "";
  const start = selectedMonth || monthStart();
  const end = nextMonthStart(new Date(`${start}T12:00:00`));

  let expensesQuery = supabase
    .from("expenses")
    .select("*, couple_members(display_name)")
    .eq("couple_id", couple.id)
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (selectedMember) expensesQuery = expensesQuery.eq("member_id", selectedMember);
  if (selectedCategory) expensesQuery = expensesQuery.eq("category", selectedCategory);

  const [{ data }, { data: monthIncomes }, { data: allMonthExpenses }] = await Promise.all([
    expensesQuery,
    supabase
      .from("incomes")
      .select("amount,kind")
      .eq("couple_id", couple.id)
      .gte("income_date", start)
      .lt("income_date", end),
    supabase
      .from("expenses")
      .select("amount,payment_method")
      .eq("couple_id", couple.id)
      .gte("expense_date", start)
      .lt("expense_date", end),
  ]);

  const expenses = (data ?? []) as ExpenseRow[];
  const incomes = (monthIncomes ?? []) as IncomeRow[];
  const monthExpenseTotals = (allMonthExpenses ?? []) as ExpenseRow[];
  const total = sumExpenses(expenses);
  const spendableBalance = sumSpendableIncomes(incomes) - sumSpendableExpenses(monthExpenseTotals);
  const foodVoucherBalance = sumFoodVoucherIncomes(incomes) - sumFoodVoucherExpenses(monthExpenseTotals);
  const filteredFoodVoucherTotal = sumFoodVoucherExpenses(expenses);
  const byMember = expensesByMember(expenses, members);
  const topCategory = dominantCategory(expenses);
  const latestExpense = expenses[0];
  const leadingMember = [...byMember].sort((a, b) => b.value - a.value)[0];

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
              <Sparkles size={14} />
              Bora lançar?
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Vocês gastaram {formatCurrency(total)}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {topCategory
                  ? `${topCategory} está puxando mais atenção agora.`
                  : "Ainda está tudo calmo por aqui. Vamos lançar o primeiro?"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">
                <CircleDollarSign size={14} />
                {expenses.length} lançamentos em {monthLabel(start)}
              </span>
              <span className="surface-chip">
                <UsersRound size={14} />
                {byMember.map((item) => `${item.name}: ${formatCurrency(item.value)}`).join(" · ") || "Sem gastos"}
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                Saldo {formatCurrency(spendableBalance)}
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                Alimentação {formatCurrency(foodVoucherBalance)}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Último lançamento
              </p>
              <p className="mt-2 line-clamp-1 text-2xl font-black text-white">
                {latestExpense ? latestExpense.description : "Nada ainda"}
              </p>
              <p className="mt-1 text-sm font-medium text-white/72">
                {latestExpense
                  ? `${latestExpense.couple_members?.display_name ?? "Alguém"} · ${formatCurrency(latestExpense.amount)}`
                  : "Salva o primeiro gasto e ele aparece aqui"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Quem mais lançou?
                </p>
                <p className="mt-2 text-xl font-black text-white">{leadingMember?.name ?? "Sem dados"}</p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {leadingMember ? formatCurrency(leadingMember.value) : "Primeiro gasto define"}
                </p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Saldo disponível
                </p>
                <p className="mt-2 text-xl font-black text-white">{formatCurrency(spendableBalance)}</p>
                <p className="mt-1 text-sm font-medium text-white/72">salário + extras menos gastos normais</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <SummaryCard
          label="Total filtrado"
          value={formatCurrency(total)}
          hint={selectedMember || selectedCategory ? `Filtros de ${monthLabel(start)}` : monthLabel(start)}
          tone="green"
          icon={<WalletCards size={18} />}
        />
        <SummaryCard
          label="Quem mais aparece"
          value={leadingMember?.name ?? "Sem gastos"}
          hint={leadingMember ? `${formatCurrency(leadingMember.value)} em lançamentos` : "Quando lançar, aparece aqui"}
          icon={<UsersRound size={18} />}
        />
        <SummaryCard
          label="Categoria quente"
          value={topCategory ?? "Sem categoria"}
          hint={topCategory ? "Categoria mais forte da lista" : "Bora lançar o primeiro gasto"}
          tone="purple"
          icon={<CircleDollarSign size={18} />}
        />
        <SummaryCard
          label="Pago no vale"
          value={formatCurrency(filteredFoodVoucherTotal)}
          hint="Só quando a lista tem vale alimentação"
          tone="green"
          icon={<WalletCards size={18} />}
        />
        <SummaryCard
          label="Saldo do vale"
          value={formatCurrency(foodVoucherBalance)}
          hint="Entradas de vale menos gastos no vale"
          tone={foodVoucherBalance >= 0 ? "green" : "purple"}
          icon={<WalletCards size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Novo gasto</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Lança sem drama</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                Vale alimentação fica separado e só entra em Alimentação.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-ap-mint text-ap-green ring-1 ring-emerald-100">
              <PlusCircle size={20} />
            </span>
          </div>

          <ExpenseForm members={members} currentMemberId={currentMember?.id} error={error} />
        </section>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Últimos gastos</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">O que acabou de entrar</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111827] ring-1 ring-black/5">
              {expenses.length} na lista
            </p>
          </div>

          <form className="mt-5 grid gap-3 rounded-[8px] bg-white/75 p-3 ring-1 ring-black/5 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="month" value={start} />
            <Field label="Quem gastou">
              <Select name="member" defaultValue={selectedMember}>
                <option value="">Todos</option>
                {members.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.display_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoria">
              <Select name="category" defaultValue={selectedCategory}>
                <option value="">Todas</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <button className="focus-ring h-12 rounded-[8px] bg-[#111827] px-4 text-sm font-bold text-white transition hover:bg-black">
                Filtrar
              </button>
              <a
                href={`/expenses?month=${start}`}
                className="focus-ring inline-flex h-12 items-center rounded-[8px] bg-white px-4 text-sm font-bold text-[#111827] ring-1 ring-border transition hover:bg-ap-lilac/70"
              >
                Todos
              </a>
            </div>
          </form>

          <div className="mt-5 grid gap-3">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} canDelete />
            ))}
            {!expenses.length ? (
              <EmptyState title="Nada por aqui">
                Nenhum gasto bate com esse filtro.
              </EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
