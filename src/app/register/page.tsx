import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { RegisterWizard } from "@/components/register-wizard";
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
  if (user) redirect("/onboarding");

  const { error } = await searchParams;

  return (
    <AuthCard title="Criar conta">
      <RegisterWizard initialError={error} />
    </AuthCard>
  );
}
