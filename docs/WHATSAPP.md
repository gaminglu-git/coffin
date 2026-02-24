# WhatsApp-Benachrichtigungen für Formular-Einreichungen

Mitarbeiter erhalten eine WhatsApp-Nachricht, wenn ein Interessent ein Formular (Vorsorge, Trauerfall, Beratung) auf der Website einreicht.

**Alternative ohne Meta-Account:** [Telegram und E-Mail](TELEGRAM-EMAIL.md) – kostenlos, einfacher Setup.

## Voraussetzungen

- Meta Developer Account
- WhatsApp Business API (Cloud API) eingerichtet
- Genehmigtes Nachrichten-Template in Meta Business Manager

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `WHATSAPP_ACCESS_TOKEN` | System User Access Token aus Meta Developer Console |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID der WhatsApp Business Nummer |
| `WHATSAPP_RECIPIENT_PHONE_NUMBERS` | Komma-getrennte Liste: `+49123456789,+49987654321` |
| `WHATSAPP_TEMPLATE_NAME` | (Optional) Name des genehmigten Templates, Standard: `new_form_submission` |
| `WHATSAPP_API_VERSION` | (Optional) API-Version, Standard: `v21.0` |

Ohne diese Variablen werden keine WhatsApp-Nachrichten versendet; die App funktioniert normal weiter.

## Template erstellen

1. Meta Business Manager → WhatsApp → Message Templates
2. Neues Utility-Template anlegen, z.B.:

**Name:** `new_form_submission`  
**Sprache:** Deutsch  
**Body:**
```
Neuer {{1}} eingegangen von {{2}} ({{3}}). Familien-PIN: {{4}}
```

**Parameter:**
- {{1}} = Art (Vorsorge / Trauerfall / Beratung)
- {{2}} = Kontaktname (ggf. mit Zusatz wie Dringlichkeit)
- {{3}} = E-Mail
- {{4}} = Familien-PIN

3. Template zur Genehmigung einreichen (kann 1–2 Tage dauern)

## Setup-Anleitung

1. [Meta for Developers](https://developers.facebook.com/) → App erstellen
2. WhatsApp-Produkt hinzufügen → Cloud API
3. Telefonnummer verknüpfen (Test- oder Produktionsnummer)
4. System User Access Token mit `whatsapp_business_messaging` erstellen
5. Phone Number ID aus der API-Setup-Seite kopieren
6. Umgebungsvariablen in `.env.local` oder Deployment setzen
