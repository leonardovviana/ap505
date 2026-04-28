"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5">
      <section className="max-w-sm rounded-[8px] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-xl font-black text-[#111827]">Ih, algo saiu torto.</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-muted">Tenta recarregar essa parte do AP505.</p>
        <Button type="button" onClick={reset} className="mt-4">
          Tentar de novo
        </Button>
      </section>
    </main>
  );
}
