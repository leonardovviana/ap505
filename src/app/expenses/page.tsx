import { CircleDollarSign, PlusCircle, Sparkles, UsersRound, WalletCards } from "lucide-react";
import { createExpenseAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ExpenseCard } from "@/components/expense-card";
import { MemberSwitcher } from "@/components/member-switcher";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { requireCouple } from "@/lib/auth/context";
import { dominantCategory, expensesByMember, sumExpenses } from "@/lib/expenses/summary";
import { formatCurrency, toISODate } from "@/lib/utils";
import type { ExpenseRow } from "@/types/app";
import { categories, paymentMethods } from "@/types/app";

export const metadata = {
  title: "Gastos",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, couple, members, currentMember } = await requireCouple();
  const { error } = await searchParams;
  const { data } = await supabase
    .from("expenses")
    .select("*, couple_members(display_name)")
    .eq("couple_id", couple.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

  const expenses = (data ?? []) as ExpenseRow[];
  const total = sumExpenses(expenses);
  const byMember = expensesByMember(expenses, members);
  const topCategory = dominantCategory(expenses);
  const latestExpense = expenses[0];
  const leadingMember = [...byMember].sort((a, b) => b.value - a.value)[0];

  return (
    <AppShell coupleId={couple.id} members={members}>
      <section className="hero-panel rounded-[8px] p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-5">
            <span className="surface-chip">
              <Sparkles size={14} />
              Bora lançar?
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Vocês gastaram {formatCurrency(total)} esse mês
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {topCategory
                  ? `${topCategory} tá puxando mais atenção agora.`
                  : "Ainda tá tudo calmo por aqui. Vamos lançar o primeiro?"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">
                <CircleDollarSign size={14} />
                {expenses.length} lançamentos
              </span>
              <span className="surface-chip">
                <UsersRound size={14} />
                {byMember.map((item) => `${item.name}: ${formatCurrency(item.value)}`).join(" · ") || "Sem gastos"}
              </span>
              <span className="surface-chip">
                <WalletCards size={14} />
                {topCategory ?? "Sem categoria"}
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
                <p className="mt-2 text-xl font-black text-white">
                  {leadingMember?.name ?? "Sem dados"}
                </p>
                <p className="mt-1 text-sm font-medium text-white/72">
                  {leadingMember ? formatCurrency(leadingMember.value) : "Primeiro gasto define"}
                </p>
              </div>
              <div className="rounded-[8px] bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                  Ritmo do mês
                </p>
                <p className="mt-2 text-xl font-black text-white">{expenses.length}</p>
                <p className="mt-1 text-sm font-medium text-white/72">lançamentos até agora</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total do mês"
          value={formatCurrency(total)}
          hint="Tudo que entrou na conta do casal"
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
          hint={topCategory ? "Categoria mais forte do mês" : "Bora lançar o primeiro gasto"}
          tone="purple"
          icon={<CircleDollarSign size={18} />}
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
                Preenche os campos básicos e deixa o resto organizado no app.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-ap-mint text-ap-green ring-1 ring-emerald-100">
              <PlusCircle size={20} />
            </span>
          </div>

          <form action={createExpenseAction} className="mt-5 grid gap-4">
            <Field label="Valor">
              <Input name="amount" inputMode="decimal" placeholder="42,00" required />
            </Field>
            <Field label="Descrição">
              <Input name="description" placeholder="Mercado" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Select name="category" defaultValue="Alimentação">
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quem gastou?">
                <MemberSwitcher members={members} defaultValue={currentMember?.id} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data">
                <Input name="expense_date" type="date" defaultValue={toISODate()} required />
              </Field>
              <Field label="Pagamento">
                <Select name="payment_method" defaultValue="">
                  <option value="">Não lembro</option>
                  {paymentMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Observação" hint="Opcional, sem burocracia.">
              <Textarea name="notes" placeholder="Ex: compra da semana" />
            </Field>
            {error ? (
              <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>
            ) : null}
            <Button type="submit" className="justify-between">
              Salvar gasto
              <Sparkles size={16} />
            </Button>
          </form>
        </section>

        <section className="soft-card overflow-hidden rounded-[8px] p-5">
          <div className="mb-5 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#820AD1,#1DB954)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-title">Últimos gastos</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">O que acabou de entrar</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#111827] ring-1 ring-black/5">
              {expenses.length} no mês
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} canDelete />
            ))}
            {!expenses.length ? (
              <EmptyState title="Nada por aqui">
                Quando lançar, os gastos aparecem aqui bonitinhos.
              </EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
