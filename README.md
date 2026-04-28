# AP505

PWA privado para um casal controlar gastos juntos. Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, Gemini e Web Push.

## Rodando local

Este workspace recebeu um Node portátil em `.tools/node` porque `node` e `npm` não estavam no PATH do Windows.

```powershell
$env:PATH = "$(Join-Path (Get-Location) '.tools\node');$env:PATH"
npm run dev
```

Ou direto:

```powershell
.\.tools\node\npm.cmd run dev
```

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.5-pro
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Gere as chaves VAPID com:

```powershell
npx web-push generate-vapid-keys
```

## Supabase

1. Crie um projeto Supabase.
2. Rode a migration em `supabase/migrations/001_initial_schema.sql`.
3. Confirme que Realtime está ativo para `expenses` e `budgets`.
4. Em Auth, para teste local mais simples, desative confirmação obrigatória de email ou configure o redirect para `NEXT_PUBLIC_APP_URL`.

A migration cria:

- `profiles`
- `couples`
- `couple_members`
- `expenses`
- `budgets`
- `push_subscriptions`
- bucket público `avatars`
- RLS e RPCs de convite, casal e push

## Scripts

```powershell
npm run lint
npm run test
npm run build
```

## Rotas

- `/login`
- `/register`
- `/onboarding`
- `/dashboard`
- `/expenses`
- `/chat`
- `/budgets`
- `/reports`
- `/settings`

## Observações

O endpoint `/api/ai/parse-expense` tenta Gemini primeiro e cai para o parser local. A chave pode entrar como `GEMINI_API_KEY` ou `GOOGLE_API_KEY`; ambas funcionam no SDK.
