import { formatCurrency } from "@/lib/utils";

export function BudgetProgress({
  label,
  spent,
  budget,
}: {
  label: string;
  spent: number;
  budget: number;
}) {
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 999) : 0;
  const tone =
    percent > 100
      ? "from-rose-500 to-orange-500"
      : percent > 80
        ? "from-amber-400 to-orange-500"
        : "from-[#1DB954] to-[#820AD1]";

  return (
    <article className="overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,251,0.96))] p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-2 text-sm font-semibold text-muted">
            {formatCurrency(spent)} de {formatCurrency(budget)}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#111827] ring-1 ring-black/5">
          {Math.round(percent)}%
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </article>
  );
}
