import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  interpretFinancialEntryMessage,
  parsedFinancialEntrySchema,
} from "@/lib/expenses/parser";
import { formatShortCurrency, toISODate } from "@/lib/utils";
import {
  categories,
  incomeKindLabels,
  incomeKinds,
  paymentMethods,
  type CoupleMember,
  type ParsedFinancialEntry,
} from "@/types/app";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configure GEMINI_API_KEY or GOOGLE_API_KEY.");
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

const responseJsonSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["expense", "income"] },
    amount: { type: "number", description: "Valor em reais, sem simbolo de moeda." },
    description: { type: "string", description: "Descricao curta do lancamento." },
    category: { type: ["string", "null"], enum: [...categories, null] },
    payment_method: { type: ["string", "null"], enum: [...paymentMethods, null] },
    expense_date: { type: ["string", "null"], description: "Data do gasto no formato YYYY-MM-DD." },
    kind: { type: ["string", "null"], enum: [...incomeKinds, null] },
    income_date: { type: ["string", "null"], description: "Data da entrada no formato YYYY-MM-DD." },
    member_name: { type: "string", description: "Nome de quem fez o lancamento." },
    confidence: { type: "number", description: "Confianca entre 0 e 1." },
  },
  required: [
    "type",
    "amount",
    "description",
    "category",
    "payment_method",
    "expense_date",
    "kind",
    "income_date",
    "member_name",
    "confidence",
  ],
  additionalProperties: false,
};

function normalizeAIEntry(value: unknown): ParsedFinancialEntry {
  const raw = value as Record<string, unknown>;
  if (raw.type === "income") {
    return parsedFinancialEntrySchema.parse({
      type: "income",
      amount: raw.amount,
      description: raw.description,
      kind: raw.kind ?? "extra",
      income_date: raw.income_date ?? toISODate(),
      member_name: raw.member_name,
      confidence: raw.confidence,
    });
  }

  return parsedFinancialEntrySchema.parse({
    type: "expense",
    amount: raw.amount,
    description: raw.description,
    category: raw.category ?? "Outros",
    payment_method: raw.payment_method ?? null,
    expense_date: raw.expense_date ?? toISODate(),
    member_name: raw.member_name,
    confidence: raw.confidence,
  });
}

function makeEntryPreview(entry: ParsedFinancialEntry) {
  const date = entry.type === "income" ? entry.income_date : entry.expense_date;
  const today = toISODate();
  const yesterday = toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const when = date === today ? "hoje" : date === yesterday ? "ontem" : "nesse dia";

  if (entry.type === "income") {
    return `Confere: entrada de ${formatShortCurrency(entry.amount)} (${incomeKindLabels[entry.kind]}) ${when}?`;
  }

  return `Confere: gasto de ${formatShortCurrency(entry.amount)} em ${entry.category.toLowerCase()} ${when}?`;
}

async function generateWithModel(
  model: string,
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
) {
  const ai = getAIClient();
  const today = toISODate();
  const members = coupleMembers.map((member) => member.display_name).join(", ");

  const response = await ai.models.generateContent({
    model,
    contents: [
      `Hoje e ${today}. Extraia um lancamento financeiro em JSON a partir da mensagem do casal.`,
      `Classifique type como "income" para entradas/recebimentos e "expense" para gastos/saidas.`,
      `Membros possiveis: ${members}. Usuario atual: ${currentUser.display_name}.`,
      `Categorias de gasto permitidas: ${categories.join(", ")}.`,
      `Metodos de pagamento permitidos: ${paymentMethods.join(", ")} ou null.`,
      `Tipos de entrada permitidos: ${incomeKinds.join(", ")}.`,
      `Mensagem: "${message}"`,
    ].join("\n"),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
      systemInstruction:
        "Voce transforma mensagens informais em lancamentos financeiros. Nao invente valores. Se nao houver data, use hoje. Se nao houver pessoa, use o usuario atual. Para income, use kind salary apenas quando for salario, caso contrario extra. Responda apenas JSON valido.",
    },
  });

  return normalizeAIEntry(JSON.parse(response.text ?? "{}"));
}

export async function parseFinancialEntryWithAI(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
): Promise<ParsedFinancialEntry> {
  const models = [
    process.env.GEMINI_MODEL || "gemini-2.5-pro",
    "gemini-2.5-flash",
  ];

  let lastError: unknown;
  for (const model of models) {
    try {
      const parsed = await generateWithModel(model, message, currentUser, coupleMembers);
      const memberExists = coupleMembers.some(
        (member) => member.display_name.toLowerCase() === parsed.member_name.toLowerCase(),
      );

      if (!memberExists) {
        return {
          ...parsed,
          member_name: currentUser.display_name,
          confidence: Math.min(parsed.confidence, 0.75),
        };
      }

      return parsed;
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini indisponivel.");
}

export async function parseFinancialEntryMessage(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
) {
  try {
    const result = await parseFinancialEntryWithAI(message, currentUser, coupleMembers);
    return {
      result,
      source: "ai" as const,
      preview: makeEntryPreview(result),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("Gemini returned invalid financial entry JSON", error.flatten());
    }
    const result = interpretFinancialEntryMessage(message, currentUser, coupleMembers);
    return {
      result,
      source: "fallback" as const,
      preview: makeEntryPreview(result),
    };
  }
}
