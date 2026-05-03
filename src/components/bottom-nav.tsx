"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, BarChart3, BotMessageSquare, CircleDollarSign, Gauge, Settings, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Resumo", icon: Gauge },
  { href: "/entradas", label: "Entradas", icon: Banknote },
  { href: "/expenses", label: "Gastos", icon: CircleDollarSign },
  { href: "/chat", label: "Chat", icon: BotMessageSquare },
  { href: "/budgets", label: "Metas", icon: Target },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.94))] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-7 gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex h-12 flex-col items-center justify-center gap-1 rounded-[8px] text-[10px] font-bold text-muted transition",
                active &&
                  "bg-[linear-gradient(135deg,rgba(29,185,84,0.15),rgba(130,10,209,0.14))] text-[#111827] ring-1 ring-white shadow-sm",
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.8 : 2.2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
