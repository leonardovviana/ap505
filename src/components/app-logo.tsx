import Link from "next/link";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AP"
  );
}

export function AppLogo({ name = "Meu casal" }: { name?: string }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label={name}>
      <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-[linear-gradient(135deg,#1DB954,#820AD1)] text-sm font-black text-white shadow-lg shadow-emerald-900/20">
        {initials(name)}
      </span>
      <span className="leading-tight">
        <span className="block max-w-[150px] truncate text-lg font-black tracking-normal text-[#111827]">{name}</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">gastos do casal</span>
      </span>
    </Link>
  );
}
