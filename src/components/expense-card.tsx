import { Trash2 } from "lucide-react";
import { deleteExpenseAction } from "@/app/actions";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseRow } from "@/types/app";

export function ExpenseCard({
  expense,
  canDelete = false,
  returnTo = "/expenses",
}: {
  expense: ExpenseRow;
  canDelete?: boolean;
  returnTo?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,248,251,0.94))] shadow-sm ring-1 ring-black/5">
      <div className="flex">
        <div className="w-1 bg-[linear-gradient(180deg,#1DB954,#820AD1)]" />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-[#111827]">{expense.description}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">
                {expense.couple_members?.display_name ?? "Alguém"} ·{" "}
                {new Date(`${expense.expense_date}T12:00:00`).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <p className="shrink-0 text-base font-black text-[#111827]">{formatCurrency(expense.amount)}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={expense.category} />
              {expense.payment_method ? (
                <span className="rounded-full bg-ap-mint px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-ap-green">
                  {expense.payment_method}
                </span>
              ) : null}
              <span className="rounded-full bg-ap-lilac px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-ap-purple">
                {expense.couple_members?.display_name ?? "Pessoa"}
              </span>
            </div>

            {canDelete ? (
              <form action={deleteExpenseAction}>
                <input type="hidden" name="id" value={expense.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <Button type="submit" variant="ghost" className="h-9 w-9 px-0" aria-label="Apagar gasto">
                  <Trash2 size={16} />
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
