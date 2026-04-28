"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeRefresh({ coupleId }: { coupleId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ap505:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `couple_id=eq.${coupleId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets", filter: `couple_id=eq.${coupleId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, router]);

  return null;
}
