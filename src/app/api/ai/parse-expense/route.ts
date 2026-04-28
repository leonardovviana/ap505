import { NextResponse } from "next/server";
import { requireCouple } from "@/lib/auth/context";
import { parseExpenseMessage } from "@/lib/ai/parser";

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message?: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: "Manda um gasto pra eu entender." }, { status: 400 });
    }

    const { members, currentMember } = await requireCouple();
    if (!currentMember) {
      return NextResponse.json({ error: "Você ainda não entrou no casal." }, { status: 400 });
    }

    const payload = await parseExpenseMessage(message, currentMember, members);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não consegui entender esse gasto." },
      { status: 400 },
    );
  }
}
