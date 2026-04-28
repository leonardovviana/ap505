import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-dashed border-border bg-[linear-gradient(180deg,rgba(29,185,84,0.05),rgba(130,10,209,0.04),rgba(255,255,255,0.92))] p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <p className="text-base font-black text-[#111827]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-muted">{children}</p>
    </div>
  );
}
