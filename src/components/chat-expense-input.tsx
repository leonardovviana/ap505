"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, SendHorizonal, Sparkles, X } from "lucide-react";
import { createFinancialEntryFromParsedAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { categories, incomeKindLabels, type Category, type ParsedFinancialEntry } from "@/types/app";

type ParsePayload = {
  result: ParsedFinancialEntry;
  source: "ai" | "fallback";
  preview: string;
};

function entryDetails(entry: ParsedFinancialEntry) {
  if (entry.type === "income") {
    return `${entry.description} · ${formatCurrency(entry.amount)} · ${entry.member_name} · ${incomeKindLabels[entry.kind]}`;
  }

  return `${entry.description} · ${formatCurrency(entry.amount)} · ${entry.member_name} · ${entry.category}`;
}

export function ChatExpenseInput() {
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<ParsePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function parseMessage() {
    setError(null);
    startParsing(async () => {
      const response = await fetch("/api/ai/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Não consegui entender.");
        return;
      }
      setPayload(json);
    });
  }

  function confirmEntry() {
    if (!payload) return;
    startSaving(async () => {
      await createFinancialEntryFromParsedAction(payload.result);
      setPayload(null);
      setMessage("");
    });
  }

  function updateExpenseCategory(category: Category) {
    setPayload((current) => {
      if (!current || current.result.type !== "expense") return current;
      return {
        ...current,
        result: {
          ...current.result,
          category,
        },
        preview: `Confere: gasto de ${formatCurrency(current.result.amount)} em ${category.toLowerCase()}?`,
      };
    });
  }

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-[linear-gradient(180deg,rgba(130,10,209,0.08),rgba(29,185,84,0.05),rgba(255,255,255,0.98))] p-4 shadow-sm">
      <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[linear-gradient(135deg,rgba(29,185,84,0.14),rgba(130,10,209,0.18))] text-ap-purple ring-1 ring-white/70">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 className="text-base font-black text-[#111827]">Bora lançar?</h2>
          <p className="text-xs font-semibold text-muted">Gasto ou entrada: escreve do seu jeito.</p>
        </div>
      </div>

      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="gastei 42 no mercado ou recebi 3500 salario"
      />
      {error ? <p className="mt-3 rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      {payload ? (
        <div className="mt-3 rounded-[8px] border border-white/70 bg-white/90 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ap-purple">
            Confere antes de salvar
          </p>
          <p className="mt-2 text-sm font-black text-[#111827]">{payload.preview}</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {entryDetails(payload.result)}
            {payload.source === "fallback" ? " · modo local" : " · IA"}
          </p>

          {payload.result.type === "expense" ? (
            <div className="mt-3">
              <Field
                label="Categoria"
                hint={
                  payload.result.payment_method === "Vale alimentação"
                    ? "Vale alimentação só pode ser usado em Alimentação."
                    : "Pode corrigir antes de confirmar."
                }
              >
                <Select
                  value={payload.result.category}
                  onChange={(event) => updateExpenseCategory(event.target.value as Category)}
                  disabled={payload.result.payment_method === "Vale alimentação"}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => setPayload(null)}>
              <X size={16} /> Ajustar
            </Button>
            <Button type="button" onClick={confirmEntry} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        className="mt-3 w-full justify-between"
        disabled={!message.trim() || isParsing}
        onClick={parseMessage}
      >
        {isParsing ? <Loader2 className="animate-spin" size={16} /> : <SendHorizonal size={16} />}
        <span>Entender lançamento</span>
      </Button>
    </section>
  );
}
