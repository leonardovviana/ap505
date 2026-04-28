import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary:
    "bg-[linear-gradient(135deg,#1DB954,#15883E)] text-white shadow-lg shadow-emerald-900/15 hover:brightness-105",
  secondary:
    "bg-white text-[#111827] ring-1 ring-border hover:bg-ap-lilac/70 hover:text-[#111827]",
  ghost: "bg-transparent text-[#111827] hover:bg-ap-mint/55",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100",
};

export function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
