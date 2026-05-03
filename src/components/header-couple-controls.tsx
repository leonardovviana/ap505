"use client";

import { Camera, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { switchActiveCoupleAction, updateCurrentMemberAvatarAction } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { CoupleMember, UserCouple } from "@/types/app";

function memberInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function HeaderCoupleControls({
  activeCoupleId,
  currentMemberId,
  members,
  userCouples,
}: {
  activeCoupleId: string;
  currentMemberId?: string | null;
  members: CoupleMember[];
  userCouples: UserCouple[];
}) {
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [isSwitching, startSwitching] = useTransition();

  function switchCouple(coupleId: string) {
    const formData = new FormData();
    formData.set("couple_id", coupleId);
    startSwitching(async () => {
      await switchActiveCoupleAction(formData);
    });
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file || !currentMemberId) return;

    setUploadingMemberId(currentMemberId);
    try {
      const supabase = createClient();
      const cleanName = file.name.replace(/[^\w.-]+/g, "-");
      const path = `${currentMemberId}/${Date.now()}-${cleanName}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const formData = new FormData();
      formData.set("avatar_url", data.publicUrl);
      await updateCurrentMemberAvatarAction(formData);
    } finally {
      setUploadingMemberId(null);
    }
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {userCouples.length > 1 ? (
        <label className="relative">
          <span className="sr-only">Trocar casal</span>
          <select
            value={activeCoupleId}
            onChange={(event) => switchCouple(event.target.value)}
            disabled={isSwitching}
            className="focus-ring h-10 max-w-[180px] rounded-[8px] border border-emerald-100 bg-ap-mint px-3 text-xs font-black uppercase tracking-[0.12em] text-ap-green outline-none"
          >
            {userCouples.map((couple) => (
              <option key={couple.id} value={couple.id}>
                {couple.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="rounded-full bg-ap-mint px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-ap-green ring-1 ring-emerald-100">
          Privado
        </span>
      )}

      <div className="flex -space-x-2">
        {members.slice(0, 2).map((member) => {
          const isCurrent = member.id === currentMemberId;
          return (
            <span
              key={member.id}
              className="group relative grid h-9 w-9 place-items-center overflow-hidden rounded-[8px] border-2 border-white bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(130,10,209,0.22))] text-xs font-black text-[#111827]"
              title={isCurrent ? "Adicionar sua foto" : member.display_name}
            >
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                memberInitials(member.display_name)
              )}

              {isCurrent ? (
                <label className="absolute inset-0 grid cursor-pointer place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/55 group-hover:opacity-100">
                  {uploadingMemberId === member.id ? <Loader2 className="animate-spin" size={15} /> : <Camera size={15} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => uploadAvatar(event.target.files?.[0])}
                  />
                </label>
              ) : null}
            </span>
          );
        })}
      </div>

      {isSwitching ? (
        <span className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-white px-3 text-xs font-black text-[#111827] ring-1 ring-border">
          <Loader2 className="animate-spin" size={14} />
          Trocando
        </span>
      ) : null}
    </div>
  );
}
