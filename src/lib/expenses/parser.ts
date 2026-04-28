import { z } from "zod";
import { categories, paymentMethods, type Category, type CoupleMember, type ParsedExpense } from "@/types/app";
import { titleCase, toISODate } from "@/lib/utils";

export const parsedExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.enum(categories),
  payment_method: z.enum(paymentMethods).nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  member_name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const categoryKeywords: Record<Category, string[]> = {
  Alimentação: [
    "mercado",
    "coxinha",
    "lanche",
    "pizza",
    "ifood",
    "restaurante",
    "almoço",
    "janta",
    "padaria",
    "café",
    "comida",
  ],
  Casa: ["casa", "limpeza", "aluguel", "condomínio", "condominio", "móveis", "moveis"],
  Transporte: ["uber", "99", "ônibus", "onibus", "gasolina", "combustível", "combustivel", "metrô", "metro"],
  Lazer: ["cinema", "bar", "show", "viagem", "praia", "jogo", "lazer"],
  Saúde: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta"],
  Compras: ["roupa", "sapato", "amazon", "shopping", "presente", "compra"],
  Contas: ["luz", "água", "agua", "internet", "telefone", "boleto", "conta"],
  Outros: [],
};

export function parseBrazilianAmount(message: string) {
  const amountMatch = message.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+(?:[,.]\d{1,2})?)/i);
  if (!amountMatch) return null;
  const value = amountMatch[1].replace(/\./g, "").replace(",", ".");
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : null;
}

function inferCategory(message: string): Category {
  const normalized = message.toLowerCase();
  for (const category of categories) {
    if (categoryKeywords[category].some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return "Outros";
}

function inferPayment(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("pix")) return "Pix";
  if (normalized.includes("débito") || normalized.includes("debito")) return "Débito";
  if (normalized.includes("crédito") || normalized.includes("credito") || normalized.includes("cartão")) {
    return "Crédito";
  }
  if (normalized.includes("dinheiro")) return "Dinheiro";
  return null;
}

function inferDate(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("ontem")) {
    return toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  }
  const dateMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (dateMatch) {
    const now = new Date();
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const year = dateMatch[3] ? Number(dateMatch[3].padStart(4, "20")) : now.getFullYear();
    return toISODate(new Date(year, month - 1, day));
  }
  return toISODate();
}

function inferMember(message: string, currentUser: CoupleMember, coupleMembers: CoupleMember[]) {
  const normalized = message.toLowerCase();
  return (
    coupleMembers.find((member) => normalized.includes(member.display_name.toLowerCase())) ??
    currentUser
  );
}

function cleanDescription(message: string, amount: number, memberName: string) {
  let description = message.replace(
    /(?:r\$\s*)?(?:\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+(?:[,.]\d{1,2})?)/i,
    "",
  );
  description = description
    .replace(new RegExp(memberName, "i"), "")
    .replace(/\b(eu|gastei|gastou|paguei|pagou|comprei|comprou|hoje|ontem|no|na|em|de|com|r\$)\b/gi, " ")
    .replace(/\b(pix|débito|debito|crédito|credito|cartão|cartao|dinheiro)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase(description || "Gasto rápido");
}

export function interpretExpenseMessage(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
): ParsedExpense {
  const amount = parseBrazilianAmount(message);
  if (!amount) {
    throw new Error("Não achei o valor nesse lançamento.");
  }

  const member = inferMember(message, currentUser, coupleMembers);
  const category = inferCategory(message);
  const payment = inferPayment(message);
  const expenseDate = inferDate(message);

  return parsedExpenseSchema.parse({
    amount,
    description: cleanDescription(message, amount, member.display_name),
    category,
    payment_method: payment,
    expense_date: expenseDate,
    member_name: member.display_name,
    confidence: category === "Outros" ? 0.64 : 0.78,
  });
}
