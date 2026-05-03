"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteIncomeAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { incomeKindLabels } from "@/types/app";
import type { IncomeRow } from "@/types/app";

export function IncomeCard({
  income,
  canDelete = false,
  returnTo = "/entradas",
}: {
  income: IncomeRow;
  canDelete?: boolean;
  returnTo?: string;
}) {
  const [isHidden, setIsHidden] = useState(false);
  const [isPending, startTransition] = useTransition();

  function deleteIncome() {
    setIsHidden(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", income.id);
      formData.set("return_to", returnTo);

      try {
        await deleteIncomeAction(formData);
      } catch (error) {
        setIsHidden(false);
        throw error;
      }
    });
  }

  if (isHidden) return null;

  return (
    <article className="overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,248,251,0.94))] shadow-sm ring-1 ring-black/5">
      <div className="flex">
        <div className="w-1 bg-[linear-gradient(180deg,#1DB954,#820AD1)]" />
        <div className="flex-1 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 break-words text-base font-black leading-tight text-[#111827]">{income.description}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">
                {income.couple_members?.display_name ?? "Alguém"} ·{" "}
                {new Date(`${income.income_date}T12:00:00`).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <p className="shrink-0 self-start text-base font-black whitespace-nowrap text-[#111827]">
              {formatCurrency(income.amount)}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ap-mint px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-ap-green">
                {incomeKindLabels[income.kind]}
              </span>
              <span className="rounded-full bg-ap-lilac px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-ap-purple">
                {income.couple_members?.display_name ?? "Pessoa"}
              </span>
            </div>

            {canDelete ? (
              <Button
                type="button"
                variant="danger"
                className="h-9 w-full px-3 text-xs shadow-none hover:bg-rose-600 hover:text-white hover:ring-rose-600 sm:w-auto"
                aria-label="Apagar entrada"
                disabled={isPending}
                onClick={deleteIncome}
              >
                <Trash2 size={15} />
                Apagar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
