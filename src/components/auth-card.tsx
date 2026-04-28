import type { ReactNode } from "react";
import { AppLogo } from "@/components/app-logo";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-center gap-8">
        <AppLogo />
        <div className="soft-card overflow-hidden rounded-[8px] p-6 md:p-7">
          <div className="mb-7 h-1.5 w-20 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
          <div className="mb-7">
            <h1 className="text-3xl font-black tracking-normal text-[#111827] md:text-4xl">
              {title}
            </h1>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
