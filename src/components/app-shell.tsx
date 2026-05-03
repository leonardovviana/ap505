import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions";
import { AppLogo } from "@/components/app-logo";
import { BottomNav } from "@/components/bottom-nav";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { Button } from "@/components/ui/button";
import type { CoupleMember } from "@/types/app";

const desktopLinks = [
  ["Resumo", "/dashboard"],
  ["Entradas", "/entradas"],
  ["Gastos", "/expenses"],
  ["Chat", "/chat"],
  ["Metas", "/budgets"],
  ["Relatórios", "/reports"],
  ["Ajustes", "/settings"],
];

export function AppShell({
  children,
  coupleId,
  members,
}: {
  children: ReactNode;
  coupleId: string;
  members: CoupleMember[];
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(29,185,84,0.16),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(130,10,209,0.16),transparent_28%),linear-gradient(180deg,#f7f8fa_0%,#f5f7fb_100%)]">
      <RealtimeRefresh coupleId={coupleId} />
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f7f8fa]/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[8px]">
          <AppLogo />
          <nav className="hidden items-center gap-1 md:flex">
            {desktopLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="focus-ring rounded-[8px] px-3 py-2 text-sm font-bold text-muted transition hover:bg-white hover:text-[#111827]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-ap-mint px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-ap-green ring-1 ring-emerald-100">
              Privado
            </span>
            <div className="flex -space-x-2">
              {members.slice(0, 2).map((member) => (
                <span
                  key={member.id}
                  className="grid h-9 w-9 place-items-center rounded-[8px] border-2 border-white bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(130,10,209,0.22))] text-xs font-black text-[#111827]"
                  title={member.display_name}
                >
                  {member.display_name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
            <form action={signOutAction}>
              <Button variant="secondary" className="h-10 px-3">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
