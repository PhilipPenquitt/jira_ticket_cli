import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Lade Umgebungsvariablen
dotenv.config();

interface JiraTicket {
    key: string;
    fields: {
        summary: string;
        status: {
            name: string;
        };
        assignee: {
            displayName: string;
            emailAddress: string;
        } | null;
        priority: {
            name: string;
        };
        created: string;
        updated: string;
    };
}

interface JiraSearchResponse {
    issues: JiraTicket[];
    total: number;
    maxResults: number;
    startAt: number;
}

class JiraClient {
    private client: AxiosInstance;
    private jiraUrl: string;
    private authToken: string;
    private useBearer: boolean;
    private jql: string;

    constructor() {
        this.jiraUrl = process.env.JIRA_URL || '';
        this.authToken = process.env.JIRA_PAT || process.env.JIRA_API_TOKEN || '';
        // prüft ob Jira auth type gesetzt ist. Ist dies der Fall wird der Wert verwendet und mit bearer verglichen, ansonsten wird bearer als default gesetzt
        this.useBearer = (process.env.JIRA_AUTH_TYPE || 'bearer').toLowerCase() === 'bearer';
        this.jql = process.env.JIRA_JQL || 'assignee = currentUser() ORDER BY updated DESC';

        if (!this.jiraUrl || !this.authToken) {
            throw new Error('Fehlende Konfiguration: JIRA_URL und JIRA_PAT müssen in .env gesetzt sein');
        }

        // Erstelle Axios-Client mit Bearer Token (für SAML/OAuth Jira-Instanzen)
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        // Bearer Token für SAML/OAuth oder Basic Auth für Cloud
        if (this.useBearer) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        } else {
            // Fallback für Atlassian Cloud mit Email + API Token
            const email = process.env.JIRA_EMAIL || '';
            if (!email) {
                throw new Error('JIRA_EMAIL wird benötigt wenn JIRA_AUTH_TYPE=basic verwendet wird');
            }
            const basicAuth = Buffer.from(`${email}:${this.authToken}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
        }

        this.client = axios.create({
            baseURL: `${this.jiraUrl}/rest/api/2`,
            headers,
        });
    }

    /**
     * Ruft alle Tickets ab, die dem aktuellen Benutzer zugewiesen sind
     */
    async getMyTickets(): Promise<JiraTicket[]> {
        try {
            const response = await this.client.get<JiraSearchResponse>('/search', {
                params: {
                    jql: this.jql,
                    maxResults: 100,
                    fields: 'summary,status,assignee,priority,created,updated',
                },
            });

            return response.data.issues;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Fehler beim Abrufen der Tickets:', error.response?.data || error.message);
            }
            throw error;
        }
    }

    /**
     * Ruft Tickets basierend auf einer benutzerdefinierten JQL-Abfrage ab
     */
    async getTicketsByJQL(jql: string, maxResults: number = 100): Promise<JiraTicket[]> {
        try {
            const response = await this.client.get<JiraSearchResponse>('/search', {
                params: {
                    jql,
                    maxResults,
                    fields: 'summary,status,assignee,priority,created,updated',
                },
            });

            return response.data.issues;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Fehler beim Abrufen der Tickets:', error.response?.data || error.message);
            }
            throw error;
        }
    }

    /**
     * Gibt die Tickets formatiert in der Konsole aus
     */
    displayTickets(tickets: JiraTicket[]): void {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Gefundene Tickets: ${tickets.length}`);
        console.log('='.repeat(80));

        if (tickets.length === 0) {
            console.log('Keine Tickets gefunden.');
            return;
        }

        tickets.forEach((ticket, index) => {
            console.log(`\n${index + 1}. ${ticket.key} - ${ticket.fields.summary}`);
            console.log(`   Status: ${ticket.fields.status.name}`);
            console.log(`   Priorität: ${ticket.fields.priority.name}`);
            console.log(`   Zugewiesen an: ${ticket.fields.assignee?.displayName || 'Nicht zugewiesen'}`);
            console.log(`   Erstellt: ${new Date(ticket.fields.created).toLocaleDateString('de-DE')}`);
            console.log(`   Aktualisiert: ${new Date(ticket.fields.updated).toLocaleDateString('de-DE')}`);
            console.log(`   Link: ${this.jiraUrl}/browse/${ticket.key}`);
        });

        console.log(`\n${'='.repeat(80)}\n`);
    }
}

// Hauptfunktion
async function main() {
    try {
        const jiraClient = new JiraClient();

        console.log('Rufe Ihre Jira-Tickets ab...\n');

        // Hole alle Tickets, die dem aktuellen Benutzer zugewiesen sind
        const myTickets = await jiraClient.getMyTickets();
        // const allOpenTickets = await jiraClient.getTicketsByJQL('assignee = currentUser() AND status != Done');
        jiraClient.displayTickets(myTickets);

        // Beispiele für weitere JQL-Abfragen:
        // const allOpenTickets = await jiraClient.getTicketsByJQL('assignee = currentUser() AND status != Done');
        // const recentTickets = await jiraClient.getTicketsByJQL('assignee = currentUser() AND updated >= -7d');

    } catch (error) {
        if (error instanceof Error) {
            console.error('Fehler:', error.message);
        } else {
            console.error('Ein unbekannter Fehler ist aufgetreten');
        }
        process.exit(1);
    }
}

// Starte das Script
main();
