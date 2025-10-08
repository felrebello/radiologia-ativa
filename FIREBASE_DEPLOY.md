
# Deploy na Firebase Hosting (Vite + React)

## Pré-requisitos
- Node 18+
- Firebase CLI instalado: `npm i -g firebase-tools`

## Passo a passo
1. **Login** na Firebase:
   ```bash
   firebase login
   ```

2. **Selecione/adicione** seu projeto (troque o ID no `.firebaserc` ou rode o comando):
   ```bash
   firebase use --add
   # escolha seu projeto e um alias (ex.: default)
   ```

3. **Instale dependências** e gere build:
   ```bash
   npm install
   npm run build
   ```

4. **Deploy**:
   ```bash
   firebase deploy
   ```

> Obs:
> - O `firebase.json` já está configurado para servir a pasta `dist` e fazer SPA rewrite para `/index.html`.
> - Caso deseje definir um **site** específico (multi‑site), use:
>   ```bash
>   firebase target:apply hosting app site-id-do-hosting
>   firebase deploy --only hosting:app
>   ```
