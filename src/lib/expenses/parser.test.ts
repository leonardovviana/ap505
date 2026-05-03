import { describe, expect, it } from "vitest";
import { interpretExpenseMessage, interpretFinancialEntryMessage, parseBrazilianAmount } from "@/lib/expenses/parser";
import type { CoupleMember } from "@/types/app";

const maria: CoupleMember = {
  id: "member-maria",
  user_id: "user-maria",
  couple_id: "couple",
  display_name: "Leonardo",
  role: "owner",
  is_active: true,
};

const joao: CoupleMember = {
  id: "member-joao",
  user_id: "user-joao",
  couple_id: "couple",
  display_name: "Isabela",
  role: "member",
  is_active: true,
};

const members = [maria, joao];

describe("parseBrazilianAmount", () => {
  it("normalizes comma amounts", () => {
    expect(parseBrazilianAmount("5,00 coxinha")).toBe(5);
  });

  it("normalizes thousand separators", () => {
    expect(parseBrazilianAmount("R$ 1.234,56 mercado")).toBe(1234.56);
  });
});

describe("interpretExpenseMessage", () => {
  it("interprets a simple snack", () => {
    const result = interpretExpenseMessage("5,00 coxinha", maria, members);

    expect(result.type).toBe("expense");
    expect(result.amount).toBe(5);
    expect(result.category).toBe("Alimentação");
    expect(result.member_name).toBe("Leonardo");
    expect(result.description).toBe("Coxinha");
  });

  it("finds the named member", () => {
    const result = interpretExpenseMessage("Isabela gastou 30 ontem no mercado pix", maria, members);

    expect(result.amount).toBe(30);
    expect(result.member_name).toBe("Isabela");
    expect(result.payment_method).toBe("Pix");
    expect(result.expense_date).not.toBe(new Date().toISOString().slice(0, 10));
  });

  it("keeps regular food expenses as normal expenses", () => {
    const result = interpretExpenseMessage("gastei 80 no mercado", maria, members);

    expect(result.category).toBe("Alimentação");
    expect(result.payment_method).toBeNull();
  });

  it("falls back to Outros for unknown categories", () => {
    const result = interpretExpenseMessage("gastei 42 em sei lá", maria, members);

    expect(result.category).toBe("Outros");
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("interprets income messages", () => {
    const result = interpretFinancialEntryMessage("recebi 3500 salario", maria, members);

    expect(result.type).toBe("income");
    expect(result.amount).toBe(3500);
    if (result.type === "income") {
      expect(result.kind).toBe("salary");
      expect(result.description).toBe("Salario");
    }
  });

  it("treats ticket alimentação credit as regular income", () => {
    const result = interpretFinancialEntryMessage("recebi 600 de ticket alimentação", maria, members);

    expect(result.type).toBe("income");
    if (result.type === "income") {
      expect(result.kind).toBe("extra");
    }
  });
});
