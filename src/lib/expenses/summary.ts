import type { BudgetRow, Category, CoupleMember, ExpenseRow } from "@/types/app";
import { categories } from "@/types/app";

export function sumExpenses(expenses: ExpenseRow[]) {
  return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
}

export function isFoodVoucherExpense(expense: Pick<ExpenseRow, "payment_method">) {
  return expense.payment_method === "Vale alimentação";
}

export function sumSpendableExpenses(expenses: ExpenseRow[]) {
  return expenses
    .filter((expense) => !isFoodVoucherExpense(expense))
    .reduce((total, expense) => total + Number(expense.amount), 0);
}

export function sumFoodVoucherExpenses(expenses: ExpenseRow[]) {
  return expenses
    .filter(isFoodVoucherExpense)
    .reduce((total, expense) => total + Number(expense.amount), 0);
}

export function expensesByCategory(expenses: ExpenseRow[]) {
  return categories
    .map((category) => ({
      name: category,
      value: expenses
        .filter((expense) => expense.category === category)
        .reduce((total, expense) => total + Number(expense.amount), 0),
    }))
    .filter((item) => item.value > 0);
}

export function expensesByMember(expenses: ExpenseRow[], members: CoupleMember[]) {
  return members.map((member) => ({
    name: member.display_name,
    value: expenses
      .filter((expense) => expense.member_id === member.id)
      .reduce((total, expense) => total + Number(expense.amount), 0),
  }));
}

export function dominantCategory(expenses: ExpenseRow[]) {
  const sorted = expensesByCategory(expenses).sort((a, b) => b.value - a.value);
  return sorted[0]?.name as Category | undefined;
}

export function monthlyBudget(budgets: BudgetRow[]) {
  return budgets.find((budget) => budget.scope === "monthly" && !budget.category);
}

export function categoryBudget(budgets: BudgetRow[], category: string) {
  return budgets.find((budget) => budget.scope === "category" && budget.category === category);
}
