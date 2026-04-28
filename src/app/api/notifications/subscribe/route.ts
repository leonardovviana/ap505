import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/context";

type BrowserSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const subscription = (await request.json()) as BrowserSubscription;

  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) {
    return NextResponse.json({ error: "Subscription inválida." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_couple_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      couple_id: profile?.active_couple_id ?? null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_secret: subscription.keys.auth,
      user_agent: request.headers.get("user-agent"),
    },
    { onConflict: "endpoint" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
