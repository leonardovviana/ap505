import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#111827]">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-medium text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "focus-ring h-12 rounded-[8px] border border-border bg-white px-4 text-sm font-medium text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400",
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "focus-ring h-12 rounded-[8px] border border-border bg-white px-4 text-sm font-medium text-[#111827] shadow-sm outline-none transition",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "focus-ring min-h-24 rounded-[8px] border border-border bg-white px-4 py-3 text-sm font-medium text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400",
        props.className,
      )}
    />
  );
}
