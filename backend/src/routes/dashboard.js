
import { Router } from "express";
import db from "../database.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS totalTickets,

        SUM(
          CASE WHEN status = 'Open'
          THEN 1 ELSE 0 END
        ) AS openTickets,

        SUM(
          CASE WHEN status = 'In Progress'
          THEN 1 ELSE 0 END
        ) AS inProgressTickets,

        SUM(
          CASE WHEN status = 'Resolved'
          THEN 1 ELSE 0 END
        ) AS resolvedTickets,

        SUM(
          CASE WHEN priority = 'Urgent'
          THEN 1 ELSE 0 END
        ) AS urgentTickets,

        SUM(
          CASE
            WHEN status != 'Resolved'
              AND julianday(created_at)
                < julianday('now', '-24 hours')
            THEN 1
            ELSE 0
          END
        ) AS overdueTickets

      FROM tickets
    `).get();

    // SQLite SUM() returns NULL when the table is empty.
    // Return zero for each metric in that case.
    const dashboard = Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [
        key,
        value ?? 0,
      ])
    );

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
    });
  }
});

export default router;
