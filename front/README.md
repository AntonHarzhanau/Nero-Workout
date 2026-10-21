# Nero — Frontend

Interface Next.js avec React, Tailwind CSS, shadcn/ui et Recharts.
Les instructions de démarrage avec les services et les données de démonstration
sont dans le [README du projet](../README.md).

Depuis ce dossier :

```bash
npm ci
npm run dev
```

Pour le développement hors Docker, définir `ACCOUNT_API_URL`, `WORKOUT_API_URL` et
`STATISTICS_API_URL` avec des adresses accessibles depuis le serveur Next.js.

## Vérifications

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
```

Les tests Playwright nécessitent une application et ses services démarrés.
