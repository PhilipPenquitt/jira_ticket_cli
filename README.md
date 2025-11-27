# Jira Automation Script

Ein TypeScript-Script zum Abrufen meiner Jira-Tickets über die Jira REST API mit SAML/PAT-Authentifizierung. Doku via KI 🤔.

## Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn
- Ein Jira-Account mit Zugriff auf die Jira REST API

## Installation

1. Klonen Sie das Repository oder navigieren Sie zum Projektverzeichnis

2. Installieren Sie die Abhängigkeiten:

```bash
npm install
```

## Konfiguration

### 1. Personal Access Token (PAT) erstellen

Für Jira Data Center/Server mit SAML-Authentifizierung:

1. Melden Sie sich bei Jira an (z.B. <https://jira.firma.net/jira>)
2. Klicken Sie auf Ihr Profilbild → **Profile**
3. Im linken Menü: **Personal Access Tokens**
4. Klicken Sie auf **Create token**
5. Geben Sie einen Namen ein (z.B. "Automation Script")
6. Kopieren Sie den generierten Token sofort (er wird nur einmal angezeigt!)

**Alternative für Atlassian Cloud:**

- Gehen Sie zu [Atlassian Account Security](https://id.atlassian.com/manage-profile/security/api-tokens)
- Erstellen Sie einen API Token

### 2. Umgebungsvariablen einrichten

1. Kopieren Sie die `.env.example` Datei:

```bash
cp .env.example .env
```

2. Bearbeiten Sie die `.env` Datei und fügen Sie Ihre Daten ein:

**Für Jira Data Center/Server (z.B. Telekom Jira):**

```env
JIRA_URL=https://jira.firma.net/jira
JIRA_AUTH_TYPE=bearer
JIRA_PAT=ihr-kopierter-pat-token
```

**Für Atlassian Cloud:**

```env
JIRA_URL=https://ihre-firma.atlassian.net
JIRA_AUTH_TYPE=basic
JIRA_PAT=ihr-api-token
JIRA_EMAIL=ihre.email@firma.de
```

**Wichtig:** Die `.env` Datei enthält sensible Daten und sollte niemals in Git committet werden!

## Verwendung

### Script ausführen

```bash
# Mit ts-node (Entwicklung)
npm run dev

# Oder kompilieren und ausführen
npm run build
npm start
```

### Ausgabe

Das Script zeigt alle Ihnen zugewiesenen Tickets mit folgenden Informationen:

- Ticket-Key und Zusammenfassung
- Status
- Priorität
- Zugewiesene Person
- Erstellungsdatum
- Aktualisierungsdatum
- Link zum Ticket

### Erweiterte Nutzung

Sie können die JQL-Abfrage im Script anpassen, um andere Tickets abzurufen:

```typescript
// Nur offene Tickets
const openTickets = await jiraClient.getTicketsByJQL(
  "assignee = currentUser() AND status != Done"
);

// Tickets der letzten 7 Tage
const recentTickets = await jiraClient.getTicketsByJQL(
  "assignee = currentUser() AND updated >= -7d"
);

// Tickets eines bestimmten Projekts
const projectTickets = await jiraClient.getTicketsByJQL(
  "project = PROJ AND assignee = currentUser()"
);

// Hochpriorität Tickets
const highPriorityTickets = await jiraClient.getTicketsByJQL(
  "assignee = currentUser() AND priority = High"
);
```

## Projekt-Struktur

```

jira_automation/
├── src/
│   └── index.ts          # Hauptscript
├── dist/                 # Kompilierte JavaScript-Dateien
├── .env                  # Ihre Konfiguration (nicht in Git)
├── .env.example          # Beispiel-Konfiguration
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Fehlerbehebung

### "Cannot find module 'axios' or its corresponding type declarations"

- Stellen Sie sicher, dass Sie `npm install` ausgeführt haben

### "Fehlende Konfiguration: JIRA_URL, JIRA_EMAIL und JIRA_API_TOKEN müssen in .env gesetzt sein"

- Überprüfen Sie, ob die `.env` Datei existiert und alle erforderlichen Variablen enthält

### "401 Unauthorized"

- Überprüfen Sie, ob Ihr API Token korrekt ist
- Stellen Sie sicher, dass Ihre E-Mail-Adresse korrekt ist
- Vergewissern Sie sich, dass Ihr Token nicht abgelaufen ist

### "404 Not Found"

- Überprüfen Sie die JIRA_URL in Ihrer `.env` Datei
- Die URL sollte das Format `https://ihre-firma.atlassian.net` haben (ohne `/` am Ende)

## Sicherheitshinweise

- ⚠️ Teilen Sie niemals Ihren API Token mit anderen
- ⚠️ Committen Sie niemals die `.env` Datei in Git
- 🔒 API Tokens haben die gleichen Berechtigungen wie Ihr Account
- 🔄 Rotieren Sie Ihren API Token regelmäßig

## Lizenz

ISC
