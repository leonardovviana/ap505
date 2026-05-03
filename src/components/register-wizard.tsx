"use client";

import Link from "next/link";
import { ArrowRight, Camera, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function RegisterWizard({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (signUpError) {
        setError("Cadastro não fechou. Confere os dados e tenta de novo?");
        return;
      }

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError("Conta criada, mas o Supabase ainda está exigindo confirmação por email. Desative Email Confirmations no Auth para entrar automaticamente.");
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (photo && user) {
        const cleanName = photo.name.replace(/[^\w.-]+/g, "-");
        const path = `${user.id}/profile-${Date.now()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, photo, { upsert: true });
        if (!uploadError) {
          const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
          await supabase.from("profiles").update({ avatar_url: publicUrl.publicUrl, full_name: fullName }).eq("id", user.id);
        }
      }

      router.replace("/onboarding");
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-[8px] bg-slate-100 p-1">
        <button
          type="button"
          className={`h-10 rounded-[8px] text-sm font-black transition ${step === 1 ? "bg-white text-[#111827] shadow-sm" : "text-muted"}`}
          onClick={() => setStep(1)}
        >
          1. Nome e foto
        </button>
        <button
          type="button"
          className={`h-10 rounded-[8px] text-sm font-black transition ${step === 2 ? "bg-white text-[#111827] shadow-sm" : "text-muted"}`}
          onClick={() => fullName.trim() && setStep(2)}
        >
          2. Email e senha
        </button>
      </div>

      {step === 1 ? (
        <div className="grid gap-4">
          <label className="group mx-auto grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,rgba(29,185,84,0.16),rgba(130,10,209,0.18))] text-[#111827] ring-1 ring-black/5">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid place-items-center gap-1 text-center text-sm font-black">
                <Camera size={20} />
                {initials(fullName)}
              </span>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => choosePhoto(event.target.files?.[0])} />
          </label>
          <Field label="Seu nome">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required placeholder="Leonardo" />
          </Field>
          <Button type="button" className="justify-between" disabled={!fullName.trim()} onClick={() => setStep(2)}>
            Continuar
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <Field label="Email">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="voce@email.com" />
          </Field>
          <Field label="Senha">
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="mínimo 6 caracteres"
            />
          </Field>
          {error ? <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
          <Button type="button" onClick={submit} disabled={isPending || !email.trim() || password.length < 6} className="justify-between">
            {isPending ? <Loader2 className="animate-spin" size={16} /> : "Criar conta"}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}

      <p className="text-center text-sm font-semibold text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-black text-ap-purple">
          Entrar
        </Link>
      </p>
    </div>
  );
}
