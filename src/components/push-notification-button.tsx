"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function enablePush() {
    startTransition(async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("Seu navegador não curte push por aqui.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("Faltou configurar a chave pública VAPID.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Sem permissão, sem notificação. Justo.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        setStatus("Não deu pra salvar a notificação.");
        return;
      }

      setEnabled(true);
      setStatus("Notificações ligadas.");
    });
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-white/70 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(130,10,209,0.05),rgba(255,255,255,0.96))] p-4 shadow-sm">
      <div className="mb-3 h-1 w-16 rounded-full bg-[linear-gradient(90deg,#1DB954,#820AD1)]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Notificações</p>
          <h2 className="mt-2 text-base font-black text-[#111827]">Receba aviso quando entrar gasto novo</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-muted">
            O app manda um toque quando alguém lançar uma despesa.
          </p>
          {status ? <p className="mt-2 text-xs font-black text-ap-purple">{status}</p> : null}
        </div>
        <Button type="button" onClick={enablePush} disabled={isPending || enabled} className="shrink-0">
          {isPending ? <Loader2 className="animate-spin" size={16} /> : enabled ? <BellOff size={16} /> : <Bell size={16} />}
          {enabled ? "Ligado" : "Ativar"}
        </Button>
      </div>
    </div>
  );
}
