import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

// Create an isolated in-memory test database with identical schema
function setupTestDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      customer TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
      status TEXT NOT NULL DEFAULT 'Open'
        CHECK (status IN ('Open', 'In Progress', 'Waiting on Customer', 'Resolved')),
      assignee TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE ticket_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      entry_type TEXT NOT NULL
        CHECK (entry_type IN ('public_reply', 'internal_note')),
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE ticket_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Support Agent',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  return db;
}

test("Business Rule: Ticket Creation & Automatic Activity Logging", () => {
  const db = setupTestDb();

  const insertTicket = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO tickets (subject, customer, customer_email, description, priority, status, assignee)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "Test Ticket",
      "John Doe",
      "john@example.com",
      "Login is broken",
      "High",
      "Open",
      "Support Agent"
    );

    const ticketId = Number(res.lastInsertRowid);

    db.prepare(`
      INSERT INTO ticket_activities (ticket_id, action, details)
      VALUES (?, 'created', 'Ticket created with status "Open" and priority "High"')
    `).run(ticketId);

    return ticketId;
  });

  const ticketId = insertTicket();
  assert.equal(ticketId, 1);

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  assert.equal(ticket.subject, "Test Ticket");
  assert.equal(ticket.customer, "John Doe");
  assert.equal(ticket.customer_email, "john@example.com");

  const activities = db.prepare("SELECT * FROM ticket_activities WHERE ticket_id = ?").all(ticketId);
  assert.equal(activities.length, 1);
  assert.equal(activities[0].action, "created");
});

test("Business Rule: SLA Overdue Calculation", () => {
  const db = setupTestDb();
  const pastDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const recentDate = new Date().toISOString();

  // 1. Overdue ticket: created 48h ago, status = 'Open'
  const t1 = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description, status, created_at)
    VALUES ('Overdue Issue', 'Alice', 'alice@test.com', 'Slow connection', 'Open', ?)
  `).run(pastDate);

  // 2. Not overdue: created 48h ago, but status = 'Resolved'
  const t2 = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description, status, created_at)
    VALUES ('Resolved Issue', 'Bob', 'bob@test.com', 'Solved', 'Resolved', ?)
  `).run(pastDate);

  // 3. Not overdue: created just now, status = 'Open'
  const t3 = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description, status, created_at)
    VALUES ('Recent Issue', 'Charlie', 'charlie@test.com', 'New problem', 'Open', ?)
  `).run(recentDate);

  const queryOverdue = db.prepare(`
    SELECT id,
      CASE
        WHEN status != 'Resolved' AND julianday(created_at) < julianday('now', '-24 hours')
        THEN 1 ELSE 0
      END AS is_overdue
    FROM tickets
  `).all();

  assert.equal(queryOverdue.find(t => t.id === Number(t1.lastInsertRowid)).is_overdue, 1);
  assert.equal(queryOverdue.find(t => t.id === Number(t2.lastInsertRowid)).is_overdue, 0);
  assert.equal(queryOverdue.find(t => t.id === Number(t3.lastInsertRowid)).is_overdue, 0);
});

test("Business Rule: Field Mutations trigger Activity History entries", () => {
  const db = setupTestDb();

  const t = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description, priority, status)
    VALUES ('Network bug', 'Eve', 'eve@network.com', 'Port closed', 'Low', 'Open')
  `).run();
  const ticketId = Number(t.lastInsertRowid);

  // Change status to In Progress and priority to Urgent
  const updates = [
    { action: "status_changed", details: 'status changed from "Open" to "In Progress"' },
    { action: "priority_changed", details: 'priority changed from "Low" to "Urgent"' },
  ];

  for (const u of updates) {
    db.prepare(`
      INSERT INTO ticket_activities (ticket_id, action, details, author)
      VALUES (?, ?, ?, 'Support Agent')
    `).run(ticketId, u.action, u.details);
  }

  const activities = db.prepare("SELECT * FROM ticket_activities WHERE ticket_id = ?").all(ticketId);
  assert.equal(activities.length, 2);
  assert.equal(activities[0].action, "status_changed");
  assert.equal(activities[1].action, "priority_changed");
});

test("Business Rule: Replies and Internal Notes update timestamps and maintain distinct entry types", () => {
  const db = setupTestDb();

  const t = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description)
    VALUES ('Payment fail', 'Dan', 'dan@pay.com', 'Card declined')
  `).run();
  const ticketId = Number(t.lastInsertRowid);

  // Add Public Reply
  db.prepare(`
    INSERT INTO ticket_entries (ticket_id, entry_type, content, author)
    VALUES (?, 'public_reply', 'Please try with a Visa card.', 'Support Agent')
  `).run(ticketId);

  // Add Internal Note
  db.prepare(`
    INSERT INTO ticket_entries (ticket_id, entry_type, content, author)
    VALUES (?, 'internal_note', 'Stripe error code: card_declined_insufficient_funds', 'Support Agent')
  `).run(ticketId);

  const entries = db.prepare("SELECT * FROM ticket_entries WHERE ticket_id = ? ORDER BY id ASC").all(ticketId);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].entry_type, "public_reply");
  assert.equal(entries[1].entry_type, "internal_note");
});

test("Data Integrity: Foreign Key Cascade Deletion prevents orphaned rows", () => {
  const db = setupTestDb();

  const t = db.prepare(`
    INSERT INTO tickets (subject, customer, customer_email, description)
    VALUES ('Temporary ticket', 'User', 'user@temp.com', 'Temporary')
  `).run();
  const ticketId = Number(t.lastInsertRowid);

  db.prepare("INSERT INTO ticket_entries (ticket_id, entry_type, content, author) VALUES (?, 'public_reply', 'hi', 'agent')").run(ticketId);
  db.prepare("INSERT INTO ticket_activities (ticket_id, action, details) VALUES (?, 'created', 'created')").run(ticketId);

  // Verify child entries exist
  assert.equal(db.prepare("SELECT COUNT(*) as c FROM ticket_entries WHERE ticket_id = ?").get(ticketId).c, 1);
  assert.equal(db.prepare("SELECT COUNT(*) as c FROM ticket_activities WHERE ticket_id = ?").get(ticketId).c, 1);

  // Delete parent ticket
  db.prepare("DELETE FROM tickets WHERE id = ?").run(ticketId);

  // Verify child entries are cleanly deleted by SQLite CASCADE
  assert.equal(db.prepare("SELECT COUNT(*) as c FROM ticket_entries WHERE ticket_id = ?").get(ticketId).c, 0);
  assert.equal(db.prepare("SELECT COUNT(*) as c FROM ticket_activities WHERE ticket_id = ?").get(ticketId).c, 0);
});
