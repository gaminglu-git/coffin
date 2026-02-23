# Portainer Deployment – Coffin

## 1. Supabase-Umgebungsvariablen

Im Portainer-Stack unter **Environment variables** (oder als `.env` im gleichen Verzeichnis wie `docker-compose.yaml`) setzen:

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL (z.B. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `NEXT_PUBLIC_APP_URL` | App-URL (z.B. `https://coffin.gellen.duckdns.org`) |
| `NEXT_PUBLIC_SITE_URL` | Site-URL (gleich wie APP_URL) |

**Wichtig:** Diese Variablen müssen sowohl als **Build Args** als auch als **Runtime Environment** gesetzt sein, damit der Build und die App funktionieren.

---

## 2. DNS-/Netzwerkfehler (Docker Hub Timeout)

Fehler wie:
```
lookup registry-1.docker.io on 192.168.178.24:53: read udp ... i/o timeout
```

**Ursache:** Der Docker-Host nutzt einen DNS-Server (z.B. Router unter 192.168.178.24), der Docker Hub nicht oder nur langsam erreicht.

**Lösung:** Auf dem Docker-Host (z.B. per SSH) andere DNS-Server eintragen:

1. `/etc/docker/daemon.json` bearbeiten:
```json
{
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```

2. Docker neu starten: `systemctl restart docker`

---

## 3. GitHub-Authentifizierung (optional)

Wenn der Stack per Git-Repository deployt wird und Portainer Fehler meldet:
```
authentication required: Invalid username or token. Password authentication is not supported for Git operations
```

**Lösung:** In Portainer unter **Stacks → Coffin → Webhook** oder **Git Repository** einen **Personal Access Token (PAT)** von GitHub hinterlegen statt Passwort. GitHub erlaubt keine Passwort-Auth mehr für Git-Operationen.

---

## 4. Stack-Deploy-Methoden

### Option A: Web Editor (empfohlen für lokale Builds)

- `docker-compose.yaml` aus dem Repo in den Web Editor einfügen
- Environment variables im Stack-Formular setzen
- Build wird auf dem Portainer-Host ausgeführt

### Option B: Git Repository

- Repo-URL angeben (z.B. `https://github.com/gaminglu-git/coffin`)
- Bei privatem Repo: GitHub PAT als Credential hinterlegen
- Environment variables im Stack setzen
