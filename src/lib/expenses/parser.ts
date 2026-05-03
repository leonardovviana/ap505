import { z } from "zod";
import { titleCase, toISODate } from "@/lib/utils";
import {
  categories,
  incomeKinds,
  paymentMethods,
  type Category,
  type CoupleMember,
  type IncomeKind,
  type ParsedExpense,
  type ParsedFinancialEntry,
} from "@/types/app";

export const parsedExpenseSchema = z.object({
  type: z.literal("expense"),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.enum(categories),
  payment_method: z.enum(paymentMethods).nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  member_name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const parsedIncomeSchema = z.object({
  type: z.literal("income"),
  amount: z.number().positive(),
  description: z.string().min(1),
  kind: z.enum(incomeKinds),
  income_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  member_name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const parsedFinancialEntrySchema = z.discriminatedUnion("type", [
  parsedExpenseSchema,
  parsedIncomeSchema,
]);

const categoryKeywords: Array<[Category, string[]]> = [
  [
    categories[0],
    [
      "mercado",
      "coxinha",
      "lanche",
      "pizza",
      "ifood",
      "restaurante",
      "almoco",
      "almoço",
      "janta",
      "padaria",
      "cafe",
      "café",
      "comida",
    ],
  ],
  [categories[1], ["casa", "limpeza", "aluguel", "condominio", "condomínio", "moveis", "móveis"]],
  [categories[2], ["uber", "99", "onibus", "ônibus", "gasolina", "combustivel", "combustível", "metro", "metrô"]],
  [categories[3], ["cinema", "bar", "show", "viagem", "praia", "jogo", "lazer"]],
  [categories[4], ["farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta"]],
  [categories[5], ["roupa", "sapato", "amazon", "shopping", "presente", "compra"]],
  [categories[6], ["luz", "agua", "água", "internet", "telefone", "boleto", "conta"]],
];

export function parseBrazilianAmount(message: string) {
  const amountMatch = message.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+(?:[,.]\d{1,2})?)/i);
  if (!amountMatch) return null;
  const value = amountMatch[1].replace(/\./g, "").replace(",", ".");
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : null;
}

function inferCategory(message: string): Category {
  const normalized = message.toLowerCase();
  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return categories[categories.length - 1];
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

function inferEntryType(message: string): "expense" | "income" {
  const normalized = message.toLowerCase();
  const incomeWords = [
    "recebi",
    "recebeu",
    "entrada",
    "entrou",
    "caiu",
    "salario",
    "salário",
    "freela",
    "bonus",
    "bônus",
    "decimo",
    "décimo",
    "vendi",
    "vendeu",
    "reembolso",
  ];

  return incomeWords.some((word) => normalized.includes(word)) ? "income" : "expense";
}

function inferIncomeKind(message: string): IncomeKind {
  const normalized = message.toLowerCase();
  return normalized.includes("salario") || normalized.includes("salário") ? "salary" : "extra";
}

function inferMember(message: string, currentUser: CoupleMember, coupleMembers: CoupleMember[]) {
  const normalized = message.toLowerCase();
  return (
    coupleMembers.find((member) => normalized.includes(member.display_name.toLowerCase())) ??
    currentUser
  );
}

function cleanDescription(message: string, memberName: string, fallback: string) {
  let description = message.replace(
    /(?:r\$\s*)?(?:\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+(?:[,.]\d{1,2})?)/i,
    "",
  );

  description = description
    .replace(new RegExp(memberName, "i"), "")
    .replace(
      /\b(eu|gastei|gastou|paguei|pagou|comprei|comprou|recebi|recebeu|entrada|entrou|caiu|hoje|ontem|no|na|em|de|com|r\$|vale|alimentacao|alimentação|ticket)\b/gi,
      " ",
    )
    .replace(/\b(pix|débito|debito|crédito|credito|cartão|cartao|dinheiro)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase(description || fallback);
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
  const payment = inferPayment(message);
  const category = inferCategory(message);
  const expenseDate = inferDate(message);

  return parsedExpenseSchema.parse({
    type: "expense",
    amount,
    description: cleanDescription(message, member.display_name, "Gasto rápido"),
    category,
    payment_method: payment,
    expense_date: expenseDate,
    member_name: member.display_name,
    confidence: category === categories[categories.length - 1] ? 0.64 : 0.78,
  });
}

export function interpretFinancialEntryMessage(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
): ParsedFinancialEntry {
  if (inferEntryType(message) === "expense") {
    return interpretExpenseMessage(message, currentUser, coupleMembers);
  }

  const amount = parseBrazilianAmount(message);
  if (!amount) {
    throw new Error("Não achei o valor nesse lançamento.");
  }

  const member = inferMember(message, currentUser, coupleMembers);
  return parsedIncomeSchema.parse({
    type: "income",
    amount,
    description: cleanDescription(message, member.display_name, "Entrada rápida"),
    kind: inferIncomeKind(message),
    income_date: inferDate(message),
    member_name: member.display_name,
    confidence: 0.78,
  });
}
