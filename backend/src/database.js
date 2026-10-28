
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const db = new Database(
  path.join(currentDir, "../support-desk.db")
);

// Enable foreign-key constraints.
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// 1. Main ticket table
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    customer TEXT NOT NULL,
    customer_email TEXT,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Open'
      CHECK (status IN (
        'Open',
        'In Progress',
        'Waiting on Customer',
        'Resolved'
      )),
    assignee TEXT,
    created_at TEXT NOT NULL DEFAULT (
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    updated_at TEXT NOT NULL DEFAULT (
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
  );

  -- 2. Public replies and internal notes
  CREATE TABLE IF NOT EXISTS ticket_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    entry_type TEXT NOT NULL
      CHECK (entry_type IN ('public_reply', 'internal_note')),
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    FOREIGN KEY (ticket_id)
      REFERENCES tickets(id) ON DELETE CASCADE
  );

  -- 3. Ticket activity history
  CREATE TABLE IF NOT EXISTS ticket_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Support Agent',
    created_at TEXT NOT NULL DEFAULT (
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    FOREIGN KEY (ticket_id)
      REFERENCES tickets(id) ON DELETE CASCADE
  );

  -- Indexes for common filters and sorting
  CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON tickets(status);

  CREATE INDEX IF NOT EXISTS idx_tickets_priority
    ON tickets(priority);

  CREATE INDEX IF NOT EXISTS idx_tickets_assignee
    ON tickets(assignee);

  CREATE INDEX IF NOT EXISTS idx_entries_ticket
    ON ticket_entries(ticket_id, created_at);

  CREATE INDEX IF NOT EXISTS idx_activities_ticket
    ON ticket_activities(ticket_id, created_at);
`);

// Migration: Ensure customer_email column exists on tickets
const tableColumns = db.prepare("PRAGMA table_info(tickets)").all();
const hasCustomerEmail = tableColumns.some((col) => col.name === "customer_email");
if (!hasCustomerEmail) {
  db.exec("ALTER TABLE tickets ADD COLUMN customer_email TEXT;");
  // Update any existing rows where customer might have contained an email
  db.exec(`
    UPDATE tickets 
    SET customer_email = CASE WHEN customer LIKE '%@%' THEN customer ELSE 'customer@example.com' END,
        customer = CASE WHEN customer LIKE '%@%' THEN 'Alex Morgan' ELSE customer END
    WHERE customer_email IS NULL;
  `);
}

export default db;
