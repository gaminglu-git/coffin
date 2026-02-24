This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mitarbeiter-Login (Employee Accounts)

Die App nutzt Supabase Auth für Mitarbeiter-Logins. Benötigte Umgebungsvariablen:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase Projekt-URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` oder `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` – für Mitarbeiter-Verwaltung (nur serverseitig)

### Ersten Admin-Account anlegen

Nach der Migration:

```bash
npm run seed:admin
```

Optional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD` setzen. Standard: walter@minten-walter.de / Walter / 2026!

## Formular-Benachrichtigungen (optional)

Bei neuen Formular-Einreichungen (Vorsorge, Trauerfall, Beratung) können Mitarbeiter informiert werden:

- **Telegram** – kostenlos, ~5 Min Setup: [docs/TELEGRAM-EMAIL.md](docs/TELEGRAM-EMAIL.md#telegram)
- **E-Mail** – kostenlos (Resend), ~10 Min Setup: [docs/TELEGRAM-EMAIL.md](docs/TELEGRAM-EMAIL.md#e-mail-resend)
- **WhatsApp** – Meta Developer Account nötig: [docs/WHATSAPP.md](docs/WHATSAPP.md)

## Docker Stack Deploy (lokales Netzwerk)

### Voraussetzungen

- Docker mit Swarm aktiviert: `docker swarm init`
- `.env` Datei mit Supabase-Credentials (siehe `.env.example`)

### Deployment

```bash
# Option A: Mit Script (lädt .env automatisch)
chmod +x scripts/deploy-stack.sh
./scripts/deploy-stack.sh

# Option B: Manuell
# 1. .env laden (z.B. .env aus .env.local kopieren)
# 2. Image bauen
docker build -t coffin-app:latest .

# 3. Variablen exportieren und deployen
export $(grep -v '^#' .env | xargs)
docker stack deploy -c docker-compose.yaml coffin
```

### Zugriff

- Lokal: http://localhost:3000
- Im Netzwerk: http://<IP-des-Hosts>:3000

### Wichtig für lokales Netzwerk

Setze `NEXT_PUBLIC_APP_URL` und `NEXT_PUBLIC_SITE_URL` in `.env` auf die erreichbare Adresse, z.B. `http://192.168.1.100:3000`, damit Redirects (z.B. nach Login) korrekt funktionieren.

### Stack verwalten

```bash
docker stack ls                    # Stacks auflisten
docker stack services coffin       # Services prüfen
docker stack rm coffin             # Stack entfernen
```
