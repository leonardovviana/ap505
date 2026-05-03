"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCouple, requireUser } from "@/lib/auth/context";
import { sendPushNotifications } from "@/lib/notifications/web-push";
import { normalizeMoneyInput, toISODate } from "@/lib/utils";
import {
  categories,
  incomeKinds,
  paymentMethods,
  type Category,
  type IncomeKind,
  type ParsedExpense,
  type PaymentMethod,
} from "@/types/app";

function asString(value: FormDataEntryValue | null, fallback = "") {
  return String(value ?? fallback).trim();
}

function cleanCategory(value: string): Category {
  return categories.includes(value as Category) ? (value as Category) : "Outros";
}

function cleanPayment(value: string): PaymentMethod | null {
  if (!value) return null;
  return paymentMethods.includes(value as PaymentMethod) ? (value as PaymentMethod) : "Outro";
}

function cleanIncomeKind(value: string): IncomeKind {
  return incomeKinds.includes(value as IncomeKind) ? (value as IncomeKind) : "salary";
}

export async function signInAction(formData: FormData) {
  const email = asString(formData.get("email")).toLowerCase();
  const password = asString(formData.get("password"));
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent("Não rolou entrar. Confere email e senha?")}`);

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const fullName = asString(formData.get("full_name"));
  const email = asString(formData.get("email")).toLowerCase();
  const password = asString(formData.get("password"));
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
    },
  });

  if (error) redirect(`/register?error=${encodeURIComponent("Cadastro não fechou. Tenta de novo?")}`);
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCoupleAction(formData: FormData) {
  const { supabase } = await requireUser();
  const coupleName = asString(formData.get("couple_name"), "AP505");
  const displayName = asString(formData.get("display_name"), "Eu");

  const { error } = await supabase.rpc("create_couple_with_member", {
    p_couple_name: coupleName,
    p_display_name: displayName,
  });

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function joinCoupleAction(formData: FormData) {
  const { supabase } = await requireUser();
  const inviteCode = asString(formData.get("invite_code")).toUpperCase();
  const displayName = asString(formData.get("display_name"), "Eu");

  const { error } = await supabase.rpc("join_couple_by_invite", {
    p_invite_code: inviteCode,
    p_display_name: displayName,
  });

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function createIncomeAction(formData: FormData) {
  const { supabase, user, couple } = await requireCouple();
  const amount = normalizeMoneyInput(formData.get("amount"));
  const memberId = asString(formData.get("member_id"));
  const kind = cleanIncomeKind(asString(formData.get("kind"), "salary"));

  const { error } = await supabase.from("incomes").insert({
    couple_id: couple.id,
    member_id: memberId,
    created_by: user.id,
    amount,
    description: asString(formData.get("description"), "Entrada"),
    kind,
    income_date: asString(formData.get("income_date"), toISODate()),
    notes: asString(formData.get("notes")) || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/entradas");
  redirect(error ? `/entradas?error=${encodeURIComponent(error.message)}` : "/entradas");
}

export async function deleteIncomeAction(formData: FormData) {
  const { supabase } = await requireCouple();
  const id = asString(formData.get("id"));
  await supabase.from("incomes").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/entradas");
}

async function notifyPartner(coupleId: string, amount: number, category: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("partner_push_subscriptions", { p_couple_id: coupleId });

  await sendPushNotifications(data ?? [], {
    title: "AP505",
    body: `Novo gasto: ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)} em ${category}`,
    url: "/expenses",
  }).catch(() => undefined);
}

export async function createExpenseAction(formData: FormData) {
  const { supabase, user, couple } = await requireCouple();
  const amount = normalizeMoneyInput(formData.get("amount"));
  const memberId = asString(formData.get("member_id"));
  const category = cleanCategory(asString(formData.get("category"), "Outros"));
  const paymentMethod = cleanPayment(asString(formData.get("payment_method")));

  const { error } = await supabase.from("expenses").insert({
    couple_id: couple.id,
    member_id: memberId,
    created_by: user.id,
    amount,
    description: asString(formData.get("description"), "Gasto"),
    category,
    payment_method: paymentMethod,
    expense_date: asString(formData.get("expense_date"), toISODate()),
    notes: asString(formData.get("notes")) || null,
  });

  if (!error) await notifyPartner(couple.id, amount, category);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  redirect(error ? `/expenses?error=${encodeURIComponent(error.message)}` : "/expenses");
}

export async function createExpenseFromParsedAction(parsed: ParsedExpense) {
  const { supabase, user, couple, members, currentMember } = await requireCouple();
  const member =
    members.find((item) => item.display_name.toLowerCase() === parsed.member_name.toLowerCase()) ??
    currentMember;

  if (!member) throw new Error("Não achei quem gastou.");

  const { error } = await supabase.from("expenses").insert({
    couple_id: couple.id,
    member_id: member.id,
    created_by: user.id,
    amount: parsed.amount,
    description: parsed.description,
    category: cleanCategory(parsed.category),
    payment_method: parsed.payment_method,
    expense_date: parsed.expense_date,
  });

  if (error) throw new Error(error.message);

  await notifyPartner(couple.id, parsed.amount, parsed.category);
  revalidatePath("/dashboard");
  revalidatePath("/chat");
  revalidatePath("/expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const { supabase } = await requireCouple();
  const id = asString(formData.get("id"));
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function upsertBudgetAction(formData: FormData) {
  const { supabase, user, couple } = await requireCouple();
  const scope = asString(formData.get("scope"), "monthly") as "monthly" | "category";
  const category = scope === "category" ? cleanCategory(asString(formData.get("category"))) : "";
  const amount = normalizeMoneyInput(formData.get("amount"));
  const month = asString(formData.get("month"), `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);

  const { error } = await supabase.from("budgets").upsert(
    {
      couple_id: couple.id,
      scope,
      category,
      amount,
      month,
      created_by: user.id,
    },
    { onConflict: "couple_id,month,scope,category" },
  );

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(error ? `/budgets?error=${encodeURIComponent(error.message)}` : "/budgets");
}
