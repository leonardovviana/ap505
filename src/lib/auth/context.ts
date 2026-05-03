import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CoupleMember, UserCouple } from "@/types/app";

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

  const [{ data: couple }, { data: members }, { data: allMemberships }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", profile.active_couple_id).single(),
    supabase
      .from("couple_members")
      .select("*")
      .eq("couple_id", profile.active_couple_id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true }),
    supabase
      .from("couple_members")
      .select("couple_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false }),
  ]);

  if (!couple) redirect("/onboarding");

  const currentMember = (members ?? []).find((member) => member.user_id === user.id) ?? null;
  if (currentMember && profile?.avatar_url && !currentMember.avatar_url) {
    currentMember.avatar_url = profile.avatar_url;
  }
  const coupleIds = (allMemberships ?? []).map((membership) => membership.couple_id);
  const { data: userCoupleRows } = coupleIds.length
    ? await supabase.from("couples").select("id, name, invite_code").in("id", coupleIds)
    : { data: [] };

  return {
    supabase,
    user,
    profile,
    couple,
    members: (members ?? []) as CoupleMember[],
    currentMember: currentMember as CoupleMember | null,
    userCouples: (userCoupleRows ?? [])
      .map((coupleItem) => {
        const membership = (allMemberships ?? []).find((item) => item.couple_id === coupleItem.id);
        return membership
          ? { id: coupleItem.id, name: coupleItem.name, invite_code: coupleItem.invite_code, role: membership.role }
          : null;
      })
      .filter(Boolean) as UserCouple[],
  };
}
