import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <AuthCard title="Criar o AP505">
      <form action={signUpAction} className="grid gap-4">
        <Field label="Seu nome">
          <Input name="full_name" autoComplete="name" required placeholder="Leonardo" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
        </Field>
        <Field label="Senha">
          <Input name="password" type="password" autoComplete="new-password" minLength={6} required placeholder="mínimo 6 caracteres" />
        </Field>
        {error ? <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
        <Button type="submit">Cadastrar</Button>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-black text-ap-purple">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
