
import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./database.js";
import ticketRoutes from "./routes/tickets.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

app.use(cors());
app.use(express.json());

// Basic health-check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Support Desk API is running",
  });
});

// Verify that the database is connected and queryable
app.get("/api/health/database", (req, res) => {
  try {
    const result = db.prepare("SELECT 1 AS connected").get();

    res.json({
      success: true,
      database: "SQLite",
      connected: result.connected === 1,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.use("/api/tickets", ticketRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Support Desk API running on http://localhost:${PORT}`);
});
