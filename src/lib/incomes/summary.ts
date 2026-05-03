import { incomeKindLabels, incomeKinds, type CoupleMember, type IncomeKind, type IncomeRow } from "@/types/app";

export function sumIncomes(incomes: IncomeRow[]) {
  return incomes.reduce((total, income) => total + Number(income.amount), 0);
}

export function sumSpendableIncomes(incomes: IncomeRow[]) {
  return incomes
    .filter((income) => income.kind !== "food_voucher")
    .reduce((total, income) => total + Number(income.amount), 0);
}

export function sumFoodVoucherIncomes(incomes: IncomeRow[]) {
  return incomes
    .filter((income) => income.kind === "food_voucher")
    .reduce((total, income) => total + Number(income.amount), 0);
}

export function incomesByMember(incomes: IncomeRow[], members: CoupleMember[]) {
  return members.map((member) => ({
    name: member.display_name,
    value: incomes
      .filter((income) => income.member_id === member.id)
      .reduce((total, income) => total + Number(income.amount), 0),
  }));
}

export function incomesByKind(incomes: IncomeRow[]) {
  return incomeKinds
    .map((kind) => ({
      kind,
      label: incomeKindLabels[kind],
      value: incomes
        .filter((income) => income.kind === kind)
        .reduce((total, income) => total + Number(income.amount), 0),
    }))
    .filter((item) => item.value > 0);
}

export function dominantIncomeKind(incomes: IncomeRow[]) {
  const sorted = incomesByKind(incomes).sort((a, b) => b.value - a.value);
  return sorted[0]?.kind as IncomeKind | undefined;
}
