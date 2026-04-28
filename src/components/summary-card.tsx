import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone = "white",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "white" | "green" | "purple";
}) {
  const toneClass =
    tone === "green"
      ? "bg-[linear-gradient(180deg,rgba(29,185,84,0.14),rgba(255,255,255,0.96))] ring-emerald-100"
      : tone === "purple"
        ? "bg-[linear-gradient(180deg,rgba(130,10,209,0.14),rgba(255,255,255,0.96))] ring-violet-100"
        : "bg-white";

  const iconClass =
    tone === "green"
      ? "bg-ap-mint text-ap-green"
      : tone === "purple"
        ? "bg-ap-lilac text-ap-purple"
        : "bg-slate-50 text-[#111827]";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[8px] p-4 shadow-sm ring-1 ring-black/5",
        toneClass,
      )}
    >
      <div className="mb-3 h-1 w-14 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-[#111827]">{value}</p>
        </div>
        {icon ? (
          <span className={cn("rounded-[8px] p-2 shadow-sm ring-1 ring-black/5", iconClass)}>{icon}</span>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-xs font-semibold text-muted">{hint}</p> : null}
    </article>
  );
}
