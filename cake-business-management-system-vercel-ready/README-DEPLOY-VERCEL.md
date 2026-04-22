# Deploy no Vercel

Este projeto já está ajustado para deploy no Vercel.

## Passos
1. Envie esta pasta para um repositório no GitHub.
2. No Vercel, clique em **Add New > Project**.
3. Importe o repositório.
4. No Supabase, crie um projeto e rode o SQL de `supabase/schema.sql`.
5. No Vercel, adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Se o Vercel pedir configurações, use:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Clique em **Deploy**.

## Arquivos adicionados/ajustados
- `vercel.json`: garante `npm ci`, build em `dist` e fallback de rotas da SPA para `index.html`
- `supabase/schema.sql`: cria a tabela onde o app salva os dados
- `.env.example`: mostra quais variáveis precisam ser configuradas
- `vite.config.ts`: base explícita `/`
- `package.json`: nome/versão e engine do Node

## Observação
Se o seu projeto estiver dentro de uma subpasta no repositório, configure a opção **Root Directory** no Vercel apontando para esta pasta.
