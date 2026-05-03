"use client";

import { Sparkles } from "lucide-react";
import { createExpenseAction } from "@/app/actions";
import { MemberSwitcher } from "@/components/member-switcher";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toISODate } from "@/lib/utils";
import { categories, paymentMethods, type CoupleMember } from "@/types/app";

export function ExpenseForm({
  members,
  currentMemberId,
  error,
}: {
  members: CoupleMember[];
  currentMemberId?: string | null;
  error?: string;
}) {
  return (
    <form action={createExpenseAction} className="mt-5 grid gap-4">
      <Field label="Valor">
        <Input name="amount" inputMode="decimal" placeholder="42,00" required />
      </Field>
      <Field label="Descrição">
        <Input name="description" placeholder="Mercado" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          <Select name="category" defaultValue="Alimentação">
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Quem gastou?">
          <MemberSwitcher members={members} defaultValue={currentMemberId ?? undefined} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data">
          <Input name="expense_date" type="date" defaultValue={toISODate()} required />
        </Field>
        <Field label="Pagamento">
          <Select name="payment_method" defaultValue="">
            <option value="">Não lembro</option>
            {paymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Observação" hint="Opcional, sem burocracia.">
        <Textarea name="notes" placeholder="Ex: compra da semana" />
      </Field>
      {error ? <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
      <Button type="submit" className="justify-between">
        Salvar gasto
        <Sparkles size={16} />
      </Button>
    </form>
  );
}
