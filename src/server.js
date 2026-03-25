import "dotenv/config";
import express from "express";
import cors from "cors";
import { createLead } from "./routes/leads.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Lead collection ──────────────────────────────────────────────────────────
// POST /api/leads
// Body: any key/value pairs matching your Airtable column names, e.g.:
//   { "Name": "Jane", "Email": "jane@example.com", "Phone": "...", "Message": "..." }
app.post("/api/leads", createLead);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 WiseTribes lead server running on port ${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/leads`);
});
