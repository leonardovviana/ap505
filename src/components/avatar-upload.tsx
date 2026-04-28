"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

export function AvatarUpload({
  userId,
  fullName,
  avatarUrl,
}: {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
}) {
  const [name, setName] = useState(fullName);
  const [url, setUrl] = useState(avatarUrl ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function upload(file: File | undefined) {
    if (!file) return;
    startTransition(async () => {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) {
        setStatus(error.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setUrl(data.publicUrl);
      setStatus("Foto pronta. Só salvar para fechar.");
    });
  }

  const initials =
    (name || fullName || "AP")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AP";

  return (
    <form action={updateProfileAction} className="soft-card overflow-hidden rounded-[8px] p-5">
      <div className="mb-4 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Seu perfil</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">Nome e foto</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-muted">
            Deixa o casal com cara de vocês em poucos segundos.
          </p>
        </div>
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,rgba(29,185,84,0.12),rgba(130,10,209,0.15))] text-[#111827] ring-1 ring-black/5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-black">{initials}</span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Nome">
          <Input
            name="full_name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Leonardo"
          />
        </Field>
        <Field label="Foto">
          <Input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />
        </Field>
        <input type="hidden" name="avatar_url" value={url} />
        {status ? <p className="text-xs font-bold text-muted">{status}</p> : null}
        <Button disabled={isPending} className="justify-between">
          <span className="flex items-center gap-2">
            <Upload size={16} />
            Salvar perfil
          </span>
          <span className="text-xs font-black uppercase tracking-[0.16em]">Pronto</span>
        </Button>
      </div>
    </form>
  );
}
