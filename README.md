# Support Desk System

A full-stack customer support ticketing application built as part of the Full-Stack Engineering Practical Assessment. The system enables support teams to triage incoming tickets, coordinate internal notes and customer replies, monitor SLAs (overdue tickets), and inspect real-time queue performance.

---

## 1. Architecture & Tech Stack

```
support-desk/
├── backend/
│   ├── src/
│   │   ├── database.js          # SQLite connection, schema definition & migrations
│   │   ├── server.js            # Express server configuration & health checks
│   │   └── routes/
│   │       ├── tickets.js       # Ticket CRUD, activity tracking, replies & notes
│   │       └── dashboard.js     # Live aggregate metrics & SLA queries
│   ├── support-desk.db          # SQLite database (WAL mode enabled)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Live queue navigation with metric badges
│   │   │   ├── StatsCards.jsx       # 6 KPI cards with click-to-filter
│   │   │   ├── TicketTable.jsx      # Ticket queue table & overdue badges
│   │   │   ├── TicketFilters.jsx    # Search, multi-criteria filters & sorting
│   │   │   ├── CreateTicketModal.jsx# Ticket creation modal with client validation
│   │   │   └── TicketDetails.jsx    # Side drawer: inline editing, replies, notes & audit trail
│   │   ├── services/
│   │   │   └── api.js               # Clean REST API client
│   │   ├── App.jsx                  # Main dashboard coordinator & toast notifications
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Tailwind CSS & custom scrollbars
│   ├── vite.config.js               # Dev server configuration with /api proxy
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

### Stack Choices
- **Frontend**: **React 18 + Vite + Tailwind CSS**
  - Ultra-fast HMR and build performance.
  - Tailwind CSS for modern, accessible UI with clear status/priority color coding.
  - **Lucide React** for consistent, lightweight iconography.
- **Backend API**: **Node.js (ES Modules) + Express 5**
  - Clean modular routing (`routes/tickets.js`, `routes/dashboard.js`).
  - Separation of concerns: business rules and database persistence isolated from presentation.
- **Database**: **SQLite via `better-sqlite3`**
  - Synchronous, high-performance local SQLite driver.
  - Configured with `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` for concurrency and data integrity.

---

## 2. Setup & Run Instructions

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Step 1: Start the Backend API
```bash
cd backend
npm install
npm run dev
```
The backend server runs at **`http://localhost:5000`**.
- Health check: `http://localhost:5000/api/health`
- Database check: `http://localhost:5000/api/health/database`

### Step 2: Start the Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs at **`http://localhost:3000`** with automatic proxying of `/api/*` to `http://localhost:5000`.

---

## 3. Database Schema & Data Integrity

The SQLite database (`support-desk.db`) is automatically initialized and migrated on server boot:

### Tables
1. **`tickets`**:
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `subject` (TEXT NOT NULL)
   - `customer` (TEXT NOT NULL) — customer's name
   - `customer_email` (TEXT) — customer's email address
   - `description` (TEXT NOT NULL)
   - `priority` (TEXT CHECK IN `'Low'`, `'Medium'`, `'High'`, `'Urgent'`)
   - `status` (TEXT CHECK IN `'Open'`, `'In Progress'`, `'Waiting on Customer'`, `'Resolved'`)
   - `assignee` (TEXT NULL)
   - `created_at` (TEXT ISO 8601)
   - `updated_at` (TEXT ISO 8601)

2. **`ticket_entries`** (Conversations & Internal Notes):
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `ticket_id` (INTEGER NOT NULL, `FOREIGN KEY REFERENCES tickets(id) ON DELETE CASCADE`)
   - `entry_type` (TEXT CHECK IN `'public_reply'`, `'internal_note'`)
   - `content` (TEXT NOT NULL)
   - `author` (TEXT NOT NULL)
   - `created_at` (TEXT ISO 8601)

3. **`ticket_activities`** (Audit Trail):
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `ticket_id` (INTEGER NOT NULL, `FOREIGN KEY REFERENCES tickets(id) ON DELETE CASCADE`)
   - `action` (TEXT NOT NULL: `created`, `status_changed`, `priority_changed`, `assignee_changed`, `reply_added`, `internal_note_added`)
   - `details` (TEXT NOT NULL)
   - `author` (TEXT NOT NULL)
   - `created_at` (TEXT ISO 8601)

### Data Integrity & Cascade Deletes
`foreign_keys = ON` ensures that no orphaned replies or activity entries can exist if a ticket is removed. Indexes are added on `status`, `priority`, `assignee`, and foreign-key join columns.

---

## 4. Business Rules Implemented

| Rule | Implementation Details |
|---|---|
| **Required Fields** | Validated on both client and server: `subject`, `customer`, `customer_email` (with regex validation), and `description`. |
| **Overdue SLA Definition** | A ticket is overdue if `status != 'Resolved'` AND `created_at` was more than 24 hours ago (`julianday(created_at) < julianday('now', '-24 hours')`). |
| **Resolution Rule** | When marked `Resolved`, a ticket immediately ceases to count as open, in progress, or overdue across the dashboard and table. |
| **Audit Logging** | Every mutation (creation, status transition, priority adjustment, assignment, public reply, internal note) automatically commits an entry to `ticket_activities` within a database transaction. |
| **Conversation Distinction** | Public customer replies and private internal notes are stored with distinct `entry_type` tags and styled with clearly distinct visual themes (blue for customer facing, amber with a lock icon for private team notes). |
| **Persistence** | All mutations are persisted directly to the SQLite database and remain intact across restarts. |

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Returns aggregate metrics: `totalTickets`, `openTickets`, `inProgressTickets`, `resolvedTickets`, `urgentTickets`, `overdueTickets`. |
| `GET` | `/api/tickets` | Query tickets with parameters: `?search=...&status=...&priority=...&assignee=...&sort=updated\|priority`. Returns tickets with computed `is_overdue`. |
| `POST` | `/api/tickets` | Create a new ticket. Body: `{ subject, customer, customer_email, description, priority, status, assignee }`. Logs `created` activity. |
| `GET` | `/api/tickets/:id` | Returns single ticket details including associated `entries` and `activities` arrays. |
| `PATCH` | `/api/tickets/:id` | Updates fields (`status`, `priority`, `assignee`, `customer`, etc.). Automatically records change events in `ticket_activities`. |
| `POST` | `/api/tickets/:id/entries` | Appends a public reply or internal note. Body: `{ content, entry_type, author }`. Updates ticket's `updated_at` and logs activity. |
| `GET` | `/api/health` | Healthcheck endpoint. |

---

### Testing & Verification
An automated test suite (`backend/test/tickets.test.js`) verifies critical business rules and SQLite cascades using Node.js's built-in test runner:
```bash
cd backend
npm test
```
**Tests Executed**:
- ✔ Ticket creation & automatic activity logging
- ✔ SLA overdue calculation (>24h and un-resolved check)
- ✔ Field mutations triggering activity history entries
- ✔ Replies and internal notes maintaining distinct entry types
- ✔ Foreign key cascade deletion preventing orphaned records

---

## 6. What Works, What is Incomplete, and Known Issues

### What Works End-to-End
1. **Dashboard Overview**: 6 live statistic cards populated dynamically from `GET /api/dashboard`. Clicking any card immediately filters the queue.
2. **Interactive Ticket Queue with Pagination**:
   - Real-time search across subject, customer name, and customer email.
   - Combined multi-criteria filtering by status, priority, assignee, and overdue status.
   - Sorting by last updated timestamp or priority rank.
   - Overdue warning badges (`⚠️ Overdue (>24h)`) for tickets breaching the 24-hour SLA.
   - Configurable page size (6, 12, 24 tickets per page) and previous/next page navigation.
   - One-click filter clearing and active filter counts.
3. **Sidebar Queues**: Live count badges for quick-switching between All, Open, In Progress, Urgent, Overdue, and Resolved queues.
4. **Create Ticket Flow**: Modal with client validation, email format checking, submit loading spinners, and toast feedback.
5. **Ticket Details Drawer**:
   - Slide-over panel displaying ticket metadata and overdue alert banners.
   - Live inline update controls for Status, Priority, and Assignee via instant `PATCH` requests.
   - Visual conversation feed separating Public Replies from Internal Notes.
   - Two-mode composer (toggle between Public Reply and Internal Note) updating timeline and activity in real time.
   - Chronological audit history log tracking all events with authors and relative timestamps.
6. **Usability & UX**:
   - Skeleton loading states.
   - Empty states with clear call-to-action buttons.
   - Transient toast notification feedback for created and updated tickets.
7. **Automated Test Suite**: 5 unit/integration tests running via `npm test` in `backend/`.

### Incomplete / Optional Stretch Goals Not Included
- **User Authentication**: Currently runs in local agent-workspace mode without username/password login. An agent identity selector is provided in the reply composer.
- **Configurable SLA Target**: The SLA rule is set to the required 24-hour threshold.

### Known Issues
- None. All core requirements, edge cases, and business rules pass verification.

---

## 7. AI Tool Usage & Architecture Rationale

- **AI Tools Used**: Used as an assistive coding copilot for scaffolding boilerplate, structuring Tailwind UI components, and generating realistic test fixtures.
- **Architectural Ownership & Validation**:
  - The SQLite database schema was extended with `customer_email` and automatic migrations to guarantee data integrity.
  - SQL transactions (`db.transaction`) were used in `routes/tickets.js` to guarantee atomicity when updating ticket records and recording audit events.
  - Vite dev server was configured with an API proxy to eliminate CORS handling and mirror production deployment topology.
  - Components were split cleanly into modular files (`Sidebar`, `StatsCards`, `TicketTable`, `TicketFilters`, `CreateTicketModal`, `TicketDetails`) to ensure testability and maintainability.
