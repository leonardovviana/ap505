import Link from "next/link";

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label="AP505">
      <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-[linear-gradient(135deg,#1DB954,#820AD1)] text-sm font-black text-white shadow-lg shadow-emerald-900/20">
        AP
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-black tracking-normal text-[#111827]">AP505</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">gastos do casal</span>
      </span>
    </Link>
  );
}
