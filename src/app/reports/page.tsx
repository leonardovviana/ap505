import Link from "next/link";
import { ArrowDownToLine, BarChart3, BadgeDollarSign, CalendarDays, FileSpreadsheet, Printer, UsersRound, WalletCards } from "lucide-react";
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

function cleanMonth(value?: string) {
  return /^\d{4}-\d{2}-01$/.test(value ?? "") ? value! : monthStart();
}

function shiftMonth(value: string, offset: number) {
  const [year, month] = value.split("-").map(Number);
  return monthStart(new Date(year, month - 1 + offset, 1));
}

function expenseCategoryHref(category: string, month: string) {
  const params = new URLSearchParams({ category, month });
  return `/expenses?${params.toString()}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase, couple, members, currentMember, userCouples } = await requireCouple();
  const { month } = await searchParams;
  const start = cleanMonth(month);
  const end = nextMonthStart(new Date(`${start}T12:00:00`));
  const exportParams = new URLSearchParams({ month: start });

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
  const previousMonth = shiftMonth(start, -1);
  const nextMonth = shiftMonth(start, 1);
  const currentMonth = monthStart();

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
              <BarChart3 size={14} />
              Relatórios
            </span>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-black tracking-normal text-white md:text-5xl">
                Fechamento de {monthLabel(start)}.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {topCategory
                  ? `${topCategory} liderou o mês. Clique em uma categoria para abrir todos os lançamentos dela.`
                  : "Esse mês ainda está zerado. Quando lançar gastos, o relatório aparece aqui."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-chip">
                <CalendarDays size={14} />
                {monthLabel(start)}
              </span>
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
                Navegar meses
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Link href={`/reports?month=${previousMonth}`} className="rounded-[8px] bg-white/10 px-3 py-2 text-center text-sm font-black text-white transition hover:bg-white/20">
                  Anterior
                </Link>
                <Link href={`/reports?month=${currentMonth}`} className="rounded-[8px] bg-white px-3 py-2 text-center text-sm font-black text-[#111827]">
                  Atual
                </Link>
                <Link href={`/reports?month=${nextMonth}`} className="rounded-[8px] bg-white/10 px-3 py-2 text-center text-sm font-black text-white transition hover:bg-white/20">
                  Próximo
                </Link>
              </div>
              <p className="mt-3 text-sm font-medium text-white/72">
                A virada do mês já começa zerada; meses anteriores ficam guardados aqui.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`/reports/export?${exportParams.toString()}&format=pdf`}
                target="_blank"
                className="rounded-[8px] bg-white/10 p-4 text-white backdrop-blur transition hover:bg-white/20"
              >
                <Printer size={18} />
                <p className="mt-2 text-sm font-black">PDF</p>
                <p className="mt-1 text-xs font-medium text-white/72">abre pronto para salvar</p>
              </a>
              <a
                href={`/reports/export?${exportParams.toString()}&format=xls`}
                className="rounded-[8px] bg-white/10 p-4 text-white backdrop-blur transition hover:bg-white/20"
              >
                <FileSpreadsheet size={18} />
                <p className="mt-2 text-sm font-black">Excel</p>
                <p className="mt-1 text-xs font-medium text-white/72">planilha organizada</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total do mês"
          value={formatCurrency(total)}
          hint={monthLabel(start)}
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
              <Link
                key={item.name}
                href={expenseCategoryHref(item.name, start)}
                className="group flex items-center justify-between rounded-[8px] bg-white/80 px-4 py-3 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-ap-mint/70 hover:ring-emerald-200"
              >
                <span>
                  <span className="block text-sm font-black text-[#111827]">{item.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-bold text-muted">
                    <ArrowDownToLine size={13} />
                    Ver gastos dessa categoria
                  </span>
                </span>
                <span className="text-sm font-black text-[#111827]">{formatCurrency(item.value)}</span>
              </Link>
            ))}
            {!byCategory.length ? (
              <EmptyState title="Sem relatório">Esse mês está zerado. Selecione outro mês ou lance novos gastos.</EmptyState>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
