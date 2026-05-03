import { Banknote, CirclePlus, Sparkles, UsersRound, WalletCards } from "lucide-react";
import { createIncomeAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { IncomeCard } from "@/components/income-card";
import { MemberSwitcher } from "@/components/member-switcher";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { requireCouple } from "@/lib/auth/context";
import { sumFoodVoucherExpenses, sumSpendableExpenses } from "@/lib/expenses/summary";
import {
  dominantIncomeKind,
  incomesByKind,
  incomesByMember,
  sumFoodVoucherIncomes,
  sumSpendableIncomes,
} from "@/lib/incomes/summary";
import { formatCurrency, monthLabel, monthStart, nextMonthStart, toISODate } from "@/lib/utils";
import type { ExpenseRow, IncomeRow } from "@/types/app";
import { incomeKindLabels, incomeKinds } from "@/types/app";

export const metadata = {
  title: "Entradas",
};

export default async function IncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, couple, members, currentMember, userCouples } = await requireCouple();
  const { error } = await searchParams;
  const start = monthStart();
  const end = nextMonthStart();

  const [
    { data: incomesData },
    { data: expensesData },
  ] = await Promise.all([
    supabase
      .from("incomes")
      .select("*, couple_members(display_name)")
      .eq("couple_id", couple.id)
      .gte("income_date", start)
      .lt("income_date", end)
      .order("income_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("expenses")
      .select("amount,payment_method")
      .eq("couple_id", couple.id)
      .gte("expense_date", start)
      .lt("expense_date", end),
  ]);

  const incomes = (incomesData ?? []) as IncomeRow[];
  const expenses = (expensesData ?? []) as ExpenseRow[];
  const totalIncome = sumSpendableIncomes(incomes);
  const totalExpenses = sumSpendableExpenses(expenses);
  const foodVoucherIncome = sumFoodVoucherIncomes(incomes);
  const foodVoucherExpenses = sumFoodVoucherExpenses(expenses);
  const balance = totalIncome - totalExpenses;
  const foodVoucherBalance = foodVoucherIncome - foodVoucherExpenses;
  const byMember = incomesByMember(incomes, members);
  const byKind = incomesByKind(incomes);
  const topKind = dominantIncomeKind(incomes);
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
              Entradas do mês
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Saldo disponível {formatCurrency(balance)}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {balance >= 0
                  ? `Entraram ${formatCurrency(totalIncome)} em salário/extras. Vale alimentação fica em outro saldo.`
                  : `Faltam ${formatCurrency(Math.abs(balance))} para cobrir as saídas fora do vale.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">
                <Banknote size={14} />
                {formatCurrency(totalIncome)} salário + extras
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                Saídas normais {formatCurrency(totalExpenses)}
              </span>
              <span className="surface-chip">
                <UsersRound size={14} />
                {byKind.map((item) => `${item.label}: ${formatCurrency(item.value)}`).join(" · ") || "Sem entradas"}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Saldo disponível
              </p>
              <p className="mt-2 text-3xl font-black text-white">{formatCurrency(balance)}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                Entradas normais {formatCurrency(totalIncome)} · saídas normais {formatCurrency(totalExpenses)}
              </p>
            </div>

            <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                Saldo alimentação
              </p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(foodVoucherBalance)}</p>
              <p className="mt-1 text-sm font-medium text-white/72">
                Vale recebido {formatCurrency(foodVoucherIncome)} · usado {formatCurrency(foodVoucherExpenses)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  {leadingMember ? "Quem mais recebeu?" : "Sem dados"}
                </p>
                <p className="mt-2 text-xl font-black text-white">{leadingMember?.name ?? "Sem dados"}</p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {leadingMember ? formatCurrency(leadingMember.value) : "Primeira entrada define"}
                </p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Tipo dominante
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  {topKind ? incomeKindLabels[topKind] : "Sem dados"}
                </p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {topKind ? "Categoria mais forte do mês" : "Lança a primeira entrada"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="Salário + extras"
          value={formatCurrency(totalIncome)}
          hint="Não inclui vale alimentação"
          tone="green"
          icon={<Banknote size={18} />}
        />
        <SummaryCard
          label="Saídas normais"
          value={formatCurrency(totalExpenses)}
          hint="Sem gastos pagos no vale"
          tone="purple"
          icon={<WalletCards size={18} />}
        />
        <SummaryCard
          label="Saldo disponível"
          value={formatCurrency(balance)}
          hint={balance >= 0 ? "Fechou no positivo" : "Ainda falta cobrir as saídas"}
          tone={balance >= 0 ? "green" : "purple"}
          icon={<UsersRound size={18} />}
        />
        <SummaryCard
          label="Saldo alimentação"
          value={formatCurrency(foodVoucherBalance)}
          hint="Vale/ticket menos uso em alimentação"
          tone={foodVoucherBalance >= 0 ? "green" : "purple"}
          icon={<WalletCards size={18} />}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Nova entrada</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Salário, extra ou vale</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">
                Registre o que entrou e acompanhe o saldo junto com os gastos.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-ap-mint text-ap-green ring-1 ring-emerald-100">
              <CirclePlus size={20} />
            </span>
          </div>

          <form action={createIncomeAction} className="mt-5 grid gap-4">
            <Field label="Valor">
              <Input name="amount" inputMode="decimal" placeholder="3500,00" required />
            </Field>
            <Field label="Descrição">
              <Input name="description" placeholder="Salário CLT" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo da entrada">
                <Select name="kind" defaultValue="salary">
                  {incomeKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {incomeKindLabels[kind]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quem recebeu?">
                <MemberSwitcher members={members} defaultValue={currentMember?.id} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data">
                <Input name="income_date" type="date" defaultValue={toISODate()} required />
              </Field>
              <Field label="Observação" hint="Opcional, sem burocracia.">
                <Textarea name="notes" placeholder="Ex: freela, bônus, 13º, venda..." />
              </Field>
            </div>
            {error ? (
              <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>
            ) : null}
            <Button type="submit" className="justify-between">
              Salvar entrada
              <Sparkles size={16} />
            </Button>
          </form>
        </section>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Últimas entradas</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">O que acabou de entrar</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111827] ring-1 ring-black/5">
              {monthLabel(start)}
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {incomes.map((income) => (
              <IncomeCard key={income.id} income={income} canDelete />
            ))}
            {!incomes.length ? (
              <EmptyState title="Nada por aqui">
                Quando lançar, as entradas aparecem aqui bonitinhas.
              </EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
