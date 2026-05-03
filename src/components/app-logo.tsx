import Link from "next/link";

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label="Junto$">
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-[8px] bg-white shadow-lg shadow-emerald-900/15 ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/logo.png" alt="" className="h-full w-full object-cover" />
      </span>
      <span className="leading-tight">
        <span className="block max-w-[150px] truncate text-lg font-black tracking-normal text-[#111827]">Junto$</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">finanças em dupla</span>
      </span>
    </Link>
  );
}
