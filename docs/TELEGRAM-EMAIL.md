# Telegram- und E-Mail-Benachrichtigungen

Mitarbeiter erhalten bei neuen Formular-Einreichungen (Vorsorge, Trauerfall, Beratung) Benachrichtigungen per **Telegram** und/oder **E-Mail**. Beide Kanäle sind kostenlos und ohne Meta Developer Account nutzbar.

---

## Telegram

### Setup (ca. 5 Minuten)

1. **Bot erstellen:** In Telegram @BotFather öffnen → `/newbot` → Namen vergeben → Token kopieren
2. **Chat-ID ermitteln:**
   - **Gruppe:** Bot zur Gruppe hinzufügen, dann `https://api.telegram.org/bot<TOKEN>/getUpdates` aufrufen (z.B. nach einer Nachricht in der Gruppe) → `chat.id` ist die Gruppen-ID (negativ, z.B. `-1001234567890`)
   - **Einzelperson:** Mit dem Bot chatten, dann `getUpdates` aufrufen → `chat.id` ist die Nutzer-ID
3. **Umgebungsvariablen setzen**

### Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `TELEGRAM_BOT_TOKEN` | Bot-Token von @BotFather |
| `TELEGRAM_CHAT_IDS` | Komma-getrennte Chat-IDs: `-1001234567890,123456789` |

Ohne diese Variablen werden keine Telegram-Nachrichten versendet.

---

## E-Mail (Resend)

### Setup (ca. 10 Minuten)

1. **Resend-Account:** [resend.com](https://resend.com) → kostenlos (100 E-Mails/Tag, 3000/Monat)
2. **Domain verifizieren:** Resend Dashboard → Domains → Domain hinzufügen, DNS-Einträge setzen
3. **API-Key erstellen:** API Keys → Create API Key
4. **Umgebungsvariablen setzen**

### Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `RESEND_API_KEY` | API-Key von Resend (beginnt mit `re_`) |
| `EMAIL_NOTIFY_RECIPIENTS` | Komma-getrennte E-Mail-Adressen: `team@firma.de,admin@firma.de` |
| `EMAIL_NOTIFY_FROM` | (Optional) Absender, z.B. `Benachrichtigungen <noreply@ihre-domain.de>`. Standard: `onboarding@resend.dev` (nur für Tests) |

**Hinweis:** Für Produktion eine verifizierte Domain als Absender verwenden. `onboarding@resend.dev` funktioniert nur für Tests an verifizierte E-Mail-Adressen.

---

## Kombination

Alle Kanäle (WhatsApp, Telegram, E-Mail) können parallel genutzt werden. Jeder Kanal wird nur aktiv, wenn die zugehörigen Umgebungsvariablen gesetzt sind.
