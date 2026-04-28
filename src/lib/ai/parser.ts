import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { interpretExpenseMessage, parsedExpenseSchema } from "@/lib/expenses/parser";
import { makePreview, toISODate } from "@/lib/utils";
import { categories, paymentMethods, type CoupleMember, type ParsedExpense } from "@/types/app";

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
    amount: { type: "number", description: "Valor em reais, sem simbolo de moeda." },
    description: { type: "string", description: "Descricao curta do gasto." },
    category: { type: "string", enum: categories },
    payment_method: { type: ["string", "null"], enum: [...paymentMethods, null] },
    expense_date: { type: "string", description: "Data no formato YYYY-MM-DD." },
    member_name: { type: "string", description: "Nome de quem gastou." },
    confidence: { type: "number", description: "Confianca entre 0 e 1." },
  },
  required: [
    "amount",
    "description",
    "category",
    "payment_method",
    "expense_date",
    "member_name",
    "confidence",
  ],
  additionalProperties: false,
};

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
      `Hoje e ${today}. Extraia um gasto em JSON a partir da mensagem do casal.`,
      `Membros possiveis: ${members}. Usuario atual: ${currentUser.display_name}.`,
      `Categorias permitidas: ${categories.join(", ")}.`,
      `Metodos de pagamento permitidos: ${paymentMethods.join(", ")} ou null.`,
      `Mensagem: "${message}"`,
    ].join("\n"),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
      systemInstruction:
        "Voce transforma mensagens informais em lancamentos financeiros. Nao invente valores. Se nao houver data, use hoje. Se nao houver pessoa, use o usuario atual. Responda apenas JSON valido.",
    },
  });

  return parsedExpenseSchema.parse(JSON.parse(response.text ?? "{}"));
}

export async function parseExpenseWithAI(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
): Promise<ParsedExpense> {
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

export async function parseExpenseMessage(
  message: string,
  currentUser: CoupleMember,
  coupleMembers: CoupleMember[],
) {
  try {
    const result = await parseExpenseWithAI(message, currentUser, coupleMembers);
    return {
      result,
      source: "ai" as const,
      preview: makePreview(result.amount, result.category, result.expense_date),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("Gemini returned invalid expense JSON", error.flatten());
    }
    const result = interpretExpenseMessage(message, currentUser, coupleMembers);
    return {
      result,
      source: "fallback" as const,
      preview: makePreview(result.amount, result.category, result.expense_date),
    };
  }
}
