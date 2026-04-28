export type Category =
  | "Alimentação"
  | "Casa"
  | "Transporte"
  | "Lazer"
  | "Saúde"
  | "Compras"
  | "Contas"
  | "Outros";

export type PaymentMethod = "Pix" | "Débito" | "Crédito" | "Dinheiro" | "Outro";

export type CoupleMember = {
  id: string;
  user_id: string;
  couple_id: string;
  display_name: string;
  role: "owner" | "member";
  is_active: boolean;
};

export type ParsedExpense = {
  amount: number;
  description: string;
  category: Category;
  payment_method: PaymentMethod | null;
  expense_date: string;
  member_name: string;
  confidence: number;
};

export type ExpenseRow = {
  id: string;
  couple_id: string;
  member_id: string;
  created_by: string;
  amount: number;
  description: string;
  category: Category;
  payment_method: PaymentMethod | null;
  expense_date: string;
  notes: string | null;
  created_at: string;
  couple_members?: {
    display_name: string;
  } | null;
};

export type BudgetRow = {
  id: string;
  couple_id: string;
  scope: "monthly" | "category";
  category: Category | "";
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
};

export const categories: Category[] = [
  "Alimentação",
  "Casa",
  "Transporte",
  "Lazer",
  "Saúde",
  "Compras",
  "Contas",
  "Outros",
];

export const paymentMethods: PaymentMethod[] = [
  "Pix",
  "Débito",
  "Crédito",
  "Dinheiro",
  "Outro",
];
