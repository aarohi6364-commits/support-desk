
import { Router } from "express";
import db from "../database.js";

const router = Router();

const validStatuses = [
  "Open",
  "In Progress",
  "Waiting on Customer",
  "Resolved",
];

const validPriorities = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

// GET /api/tickets
// Supports search, filters, and sorting.
router.get("/", (req, res) => {
  try {
    const {
      search = "",
      status,
      priority,
      assignee,
      sort = "updated",
    } = req.query;

    const conditions = [];
    const params = {};

    if (search.trim()) {
      conditions.push(
        "(subject LIKE @search OR customer LIKE @search OR customer_email LIKE @search)"
      );
      params.search = `%${search.trim()}%`;
    }

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      conditions.push("status = @status");
      params.status = status;
    }

    if (priority) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      conditions.push("priority = @priority");
      params.priority = priority;
    }

    if (assignee) {
      conditions.push("assignee = @assignee");
      params.assignee = assignee;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Only use predefined SQL fragments for sorting.
    const orderBy = {
      updated: "updated_at DESC",
      priority: `
        CASE priority
          WHEN 'Urgent' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END ASC,
        updated_at DESC
      `,
    };

    if (!Object.hasOwn(orderBy, sort)) {
      return res.status(400).json({
        success: false,
        message: "Sort must be 'updated' or 'priority'",
      });
    }

    const tickets = db.prepare(`
      SELECT *,
        CASE
          WHEN status != 'Resolved'
            AND julianday(created_at) < julianday('now', '-24 hours')
          THEN 1
          ELSE 0
        END AS is_overdue
      FROM tickets
      ${whereClause}
      ORDER BY ${orderBy[sort]}, id DESC
    `).all(params).map((t) => ({
      ...t,
      is_overdue: Boolean(t.is_overdue),
    }));

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("List tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve tickets",
    });
  }
});

// POST /api/tickets
router.post("/", (req, res) => {
  try {
    const {
      subject,
      customer,
      customer_email,
      description,
      priority = "Medium",
      status = "Open",
      assignee = null,
    } = req.body;

    // Validate required fields on the server.
    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof customer !== "string" ||
      !customer.trim() ||
      typeof customer_email !== "string" ||
      !customer_email.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject, customer name, customer email and description are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid customer email address",
      });
    }

    if (
      !validPriorities.includes(priority) ||
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status or priority",
      });
    }

    if (
      assignee !== null &&
      (typeof assignee !== "string" || !assignee.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a non-empty string or null",
      });
    }

    const createTicket = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO tickets (
          subject, customer, customer_email, description,
          priority, status, assignee
        )
        VALUES (
          @subject, @customer, @customer_email, @description,
          @priority, @status, @assignee
        )
      `).run({
        subject: subject.trim(),
        customer: customer.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        description: description.trim(),
        priority,
        status,
        assignee: assignee?.trim() || null,
      });

      const ticketId = Number(result.lastInsertRowid);

      db.prepare(`
        INSERT INTO ticket_activities (
          ticket_id, action, details
        )
        VALUES (?, ?, ?)
      `).run(
        ticketId,
        "created",
        `Ticket created with status "${status}" and priority "${priority}"`
      );

      const created = db.prepare(`
        SELECT *,
          CASE
            WHEN status != 'Resolved'
              AND julianday(created_at) < julianday('now', '-24 hours')
            THEN 1
            ELSE 0
          END AS is_overdue
        FROM tickets WHERE id = ?
      `).get(ticketId);

      return {
        ...created,
        is_overdue: Boolean(created.is_overdue),
      };
    });

    const ticket = createTicket();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
    });
  }
});


 // GET /api/tickets/:id
router.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = db.prepare(`
      SELECT *,
        CASE
          WHEN status != 'Resolved'
            AND julianday(created_at) < julianday('now', '-24 hours')
          THEN 1
          ELSE 0
        END AS is_overdue
      FROM tickets WHERE id = ?
    `).get(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const entries = db.prepare(`
      SELECT * FROM ticket_entries
      WHERE ticket_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(id);

    const activities = db.prepare(`
      SELECT * FROM ticket_activities
      WHERE ticket_id = ?
      ORDER BY created_at ASC, id ASC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...ticket,
        is_overdue: Boolean(ticket.is_overdue),
        entries,
        activities,
      },
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket",
    });
  }
});



 // PATCH /api/tickets/:id
router.patch("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const existing = db.prepare(
      "SELECT * FROM tickets WHERE id = ?"
    ).get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const allowedFields = [
      "subject",
      "customer",
      "customer_email",
      "description",
      "status",
      "priority",
      "assignee",
    ];

    const suppliedFields = Object.keys(req.body);

    if (
      suppliedFields.length === 0 ||
      suppliedFields.some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid fields to update",
      });
    }

    const updates = {};

    for (const field of suppliedFields) {
      const value = req.body[field];

      if (field === "status") {
        if (!validStatuses.includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status",
          });
        }
        updates.status = value;
      } else if (field === "priority") {
        if (!validPriorities.includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Invalid priority",
          });
        }
        updates.priority = value;
      } else if (field === "assignee") {
        if (
          value !== null &&
          (typeof value !== "string" || !value.trim())
        ) {
          return res.status(400).json({
            success: false,
            message: "Assignee must be a non-empty string or null",
          });
        }
        updates.assignee = value?.trim() || null;
      } else if (field === "customer_email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== "string" || !emailRegex.test(value.trim())) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid customer email address",
          });
        }
        updates.customer_email = value.trim().toLowerCase();
      } else {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }
        updates[field] = value.trim();
      }
    }

    const trackedFields = [
      "status",
      "priority",
      "assignee",
    ];

    const changes = trackedFields
      .filter(
        (field) =>
          Object.hasOwn(updates, field) &&
          updates[field] !== existing[field]
      )
      .map((field) => ({
        action: `${field}_changed`,
        details:
          `${field} changed from "${existing[field] ?? "Unassigned"}"` +
          ` to "${updates[field] ?? "Unassigned"}"`,
      }));

    const updateTicket = db.transaction(() => {
      const assignments = Object.keys(updates)
        .map((field) => `${field} = @${field}`);

      assignments.push("updated_at = @updated_at");

      db.prepare(`
        UPDATE tickets
        SET ${assignments.join(", ")}
        WHERE id = @id
      `).run({
        ...updates,
        updated_at: new Date().toISOString(),
        id,
      });

      const insertActivity = db.prepare(`
        INSERT INTO ticket_activities (
          ticket_id, action, details
        )
        VALUES (?, ?, ?)
      `);

      for (const change of changes) {
        insertActivity.run(
          id,
          change.action,
          change.details
        );
      }

      const updated = db.prepare(`
        SELECT *,
          CASE
            WHEN status != 'Resolved'
              AND julianday(created_at) < julianday('now', '-24 hours')
            THEN 1
            ELSE 0
          END AS is_overdue
        FROM tickets WHERE id = ?
      `).get(id);

      return {
        ...updated,
        is_overdue: Boolean(updated.is_overdue),
      };
    });

    const ticket = updateTicket();

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
});



 // POST /api/tickets/:id/entries
router.post("/:id/entries", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content, entry_type, author = "Support Agent" } =
      req.body;

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Entry content is required",
      });
    }

    if (
      !["public_reply", "internal_note"].includes(entry_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Entry type must be public_reply or internal_note",
      });
    }

    if (
      typeof author !== "string" ||
      !author.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Author must be a non-empty string",
      });
    }

    const ticket = db.prepare(
      "SELECT id FROM tickets WHERE id = ?"
    ).get(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const addEntry = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO ticket_entries (
          ticket_id, entry_type, content, author
        )
        VALUES (?, ?, ?, ?)
      `).run(
        id,
        entry_type,
        content.trim(),
        author.trim()
      );

      const entry = db.prepare(
        "SELECT * FROM ticket_entries WHERE id = ?"
      ).get(Number(result.lastInsertRowid));

      db.prepare(`
        INSERT INTO ticket_activities (
          ticket_id, action, details, author
        )
        VALUES (?, ?, ?, ?)
      `).run(
        id,
        entry_type === "public_reply"
          ? "reply_added"
          : "internal_note_added",
        entry_type === "public_reply"
          ? "A public reply was added"
          : "An internal note was added",
        author.trim()
      );

      // Conversation activity also updates the ticket's
      // last-updated timestamp.
      db.prepare(`
        UPDATE tickets
        SET updated_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), id);

      return entry;
    });

    const entry = addEntry();

    res.status(201).json({
      success: true,
      message: "Entry added successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Add entry error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add entry",
    });
  }
});


export default router;
