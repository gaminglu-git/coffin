# Coffin – Deployment via Portainer (Homelab)

Schritt-für-Schritt-Anleitung zum Deployen der Coffin-App mit Docker Compose in Portainer.

---

## Voraussetzungen

- Portainer auf deinem Homelab installiert
- Git-Repository mit dem Coffin-Code (oder Zugriff auf den Code)
- Supabase-Projekt mit URL, Anon Key und Service Role Key
- (Optional) DuckDNS- oder andere Domain für den späteren Reverse Proxy

---

## Schritt 1: Stack in Portainer anlegen

1. In Portainer einloggen
2. **Stacks** → **Add stack**
3. Name: `coffin` (oder beliebig)

---

## Schritt 2: Web Editor oder Git Repository wählen

### Option A: Git Repository (empfohlen)

1. **Build method**: **Repository** auswählen
2. **Repository URL**: `https://github.com/DEIN-USER/coffin.git` (oder deine Repo-URL)
3. **Repository reference**: `main` oder `master` (je nach Branch)
4. **Authentication**: Falls privates Repo → Username/Token eintragen

### Option B: Web Editor (manuell)

1. **Build method**: **Web editor** auswählen
2. Den Inhalt von `docker-compose.yaml` einfügen
3. **Wichtig**: Du musst den Code separat auf den Host bringen (z.B. per Git clone) und den Build-Kontext anpassen

---

## Schritt 3: Umgebungsvariablen setzen

**Kritisch**: Ohne diese Variablen schlägt der Build oder Start fehl.

Unter **Environment variables** (oder **Env**) folgende Variablen hinzufügen:

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (öffentlich) | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (geheim!) | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_APP_URL` | Öffentliche App-URL (für Auth/Callbacks) | `https://coffin.deinedomain.de` |
| `NEXT_PUBLIC_SITE_URL` | Wie APP_URL, für Redirects | `https://coffin.deinedomain.de` |

**Hinweise:**
- `NEXT_PUBLIC_*` werden beim **Build** ins Image eingebettet – bei Änderung musst du neu bauen
- Ohne Domain: `http://localhost:3000` oder `http://DEINE-IP:3000` nutzen
- Mit Reverse Proxy: die finale HTTPS-URL eintragen (z.B. `https://coffin.gellen.duckdns.org`)

---

## Schritt 4: Compose-Datei prüfen

Stelle sicher, dass die `docker-compose.yaml` im Repo bzw. im Web Editor diese Struktur hat:

```yaml
services:
  coffin:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        ...
```

Die Variablen werden von Portainer aus der Umgebung übernommen.

---

## Schritt 5: Stack deployen

1. **Deploy the stack** klicken
2. Portainer baut das Image und startet den Container
3. Der erste Build kann **5–15 Minuten** dauern (Next.js Build)

---

## Schritt 6: Logs prüfen bei Fehlern

1. **Stacks** → dein Stack `coffin` → **coffin** (Service)
2. **Logs** öffnen

### Typische Fehler

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL is not defined` | Env-Variablen fehlen | Alle Variablen in Schritt 3 setzen |
| `JavaScript heap out of memory` | Zu wenig RAM beim Build | Mind. 4 GB RAM für den Build; ggf. auf leistungsstärkerem Host bauen |
| `Cannot find module` / Build-Fehler | Abhängigkeiten oder Lockfile | `npm install` lokal prüfen, `package-lock.json` committen |
| `ECONNREFUSED` / Supabase-Fehler | Falsche Keys oder URL | Supabase-Dashboard prüfen, Keys kopieren |
| Container startet und stoppt sofort | Fehler beim Start | Logs lesen; oft fehlende oder falsche Env-Variablen |

---

## Schritt 7: App testen

- Ohne Reverse Proxy: `http://DEINE-IP:3000`
- Mit Reverse Proxy: `https://deine-domain.de` (nach Einrichtung)

---

## Schritt 8: Reverse Proxy (selbst einrichten)

Du richtest den Reverse Proxy separat ein. Typische Konfiguration (z.B. Nginx Proxy Manager, Traefik, Caddy):

- **Upstream**: `http://HOST-IP:3000` oder `http://coffin:3000` (wenn im gleichen Docker-Netzwerk)
- **Port 3000** muss vom Proxy aus erreichbar sein

---

## Updates deployen

1. Code ins Repo pushen (bei Git-Methode)
2. In Portainer: **Stacks** → **coffin** → **Pull and redeploy** (oder **Update the stack**)
3. Portainer baut ein neues Image und startet den Container neu

---

## Supabase Security (Security Advisor)

### RLS-Policies

Die Migration `20260223160000_rls_security_fixes.sql` behebt die meisten Supabase-Security-Warnungen:

- **Admin-Policies**: Nur Mitarbeiter (Eintrag in `employees`) können Admin-Daten lesen/schreiben.
- **Anon update/delete auf cases**: Entfernt – nicht genutzt und unsicher.

### Leaked Password Protection (Supabase Dashboard)

1. **Projekt** → **Authentication** → **Providers** → **Email**
2. **Leaked password protection** aktivieren (prüft gegen HaveIBeenPwned.org)
3. **Hinweis**: Nur auf Pro Plan und höher verfügbar.

---

## Kurz-Checkliste

- [ ] Stack in Portainer angelegt
- [ ] Repo-URL oder Web Editor mit `docker-compose.yaml` gesetzt
- [ ] Alle 5 Umgebungsvariablen gesetzt
- [ ] Stack deployed
- [ ] Logs ohne Fehler
- [ ] App unter `http://IP:3000` erreichbar
- [ ] Reverse Proxy (später) eingerichtet
