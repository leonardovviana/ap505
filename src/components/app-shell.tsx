import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions";
import { AppLogo } from "@/components/app-logo";
import { BottomNav } from "@/components/bottom-nav";
import { HeaderCoupleControls } from "@/components/header-couple-controls";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { Button } from "@/components/ui/button";
import type { CoupleMember, UserCouple } from "@/types/app";

const desktopLinks = [
  ["Resumo", "/dashboard"],
  ["Entradas", "/entradas"],
  ["Gastos", "/expenses"],
  ["Chat", "/chat"],
  ["Relatórios", "/reports"],
  ["Ajustes", "/settings"],
];

export function AppShell({
  children,
  coupleId,
  coupleName = "Meu casal",
  members,
  currentMemberId,
  userCouples = [],
}: {
  children: ReactNode;
  coupleId: string;
  coupleName?: string;
  members: CoupleMember[];
  currentMemberId?: string | null;
  userCouples?: UserCouple[];
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(29,185,84,0.16),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(130,10,209,0.16),transparent_28%),linear-gradient(180deg,#f7f8fa_0%,#f5f7fb_100%)]">
      <RealtimeRefresh coupleId={coupleId} />
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f7f8fa]/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[8px]">
          <AppLogo name={coupleName} />
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
            <HeaderCoupleControls
              activeCoupleId={coupleId}
              currentMemberId={currentMemberId}
              members={members}
              userCouples={userCouples}
            />
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
