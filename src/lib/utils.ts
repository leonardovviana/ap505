import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(number);
}

export function formatShortCurrency(value: number | string | null | undefined) {
  const formatted = formatCurrency(value);
  return formatted.replace(/\s/g, "");
}

export function toISODate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function monthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function nextMonthStart(date = new Date()) {
  return monthStart(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

export function monthLabel(value = monthStart()) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function normalizeMoneyInput(value: FormDataEntryValue | string | number | null) {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const normalized = raw
    .replace(/[R$\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number.parseFloat(normalized);
}

export function titleCase(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

export function makePreview(amount: number, category: string, date: string) {
  const today = toISODate();
  const yesterday = toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const when = date === today ? "hoje" : date === yesterday ? "ontem" : "nesse dia";
  return `Confere: ${formatShortCurrency(amount)} em ${category.toLowerCase()} ${when}?`;
}
