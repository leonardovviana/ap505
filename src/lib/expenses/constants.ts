import type { Category, PaymentMethod } from "@/types/app";

export const categoryColors: Record<Category, string> = {
  Alimentação: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Casa: "bg-violet-50 text-violet-700 ring-violet-200",
  Transporte: "bg-sky-50 text-sky-700 ring-sky-200",
  Lazer: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  Saúde: "bg-rose-50 text-rose-700 ring-rose-200",
  Compras: "bg-amber-50 text-amber-700 ring-amber-200",
  Contas: "bg-slate-100 text-slate-700 ring-slate-200",
  Outros: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export const paymentLabels: Record<PaymentMethod, string> = {
  Pix: "Pix",
  Débito: "Débito",
  Crédito: "Crédito",
  Dinheiro: "Dinheiro",
  "Vale alimentação": "Vale alimentação",
  Outro: "Outro",
};
