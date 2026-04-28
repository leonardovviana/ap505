import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
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
    <AuthCard title="Oi, bora ver os gastos?">
      <form action={signInAction} className="grid gap-4">
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
        </Field>
        <Field label="Senha">
          <Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </Field>
        {error ? <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
        <Button type="submit">Entrar</Button>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-muted">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-black text-ap-purple">
          Cria rapidinho
        </Link>
      </p>
    </AuthCard>
  );
}
