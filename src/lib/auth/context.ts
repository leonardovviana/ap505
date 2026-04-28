import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CoupleMember } from "@/types/app";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireCouple() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.active_couple_id) redirect("/onboarding");

  const [{ data: couple }, { data: members }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", profile.active_couple_id).single(),
    supabase
      .from("couple_members")
      .select("*")
      .eq("couple_id", profile.active_couple_id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true }),
  ]);

  if (!couple) redirect("/onboarding");

  const currentMember = (members ?? []).find((member) => member.user_id === user.id) ?? null;

  return {
    supabase,
    user,
    profile,
    couple,
    members: (members ?? []) as CoupleMember[],
    currentMember: currentMember as CoupleMember | null,
  };
}
