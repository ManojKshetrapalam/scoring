import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initSocket } from "./socket.js";
import authRouter from "./routes/auth.js";
import tournamentRouter from "./routes/tournaments.js";
import matchesRouter from "./routes/matches.js";

// Load environment configurations
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Global Middleware Configs
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Route Groupings
app.use("/api/auth", authRouter);
app.use("/api/tournaments", tournamentRouter);
app.use("/api/matches", matchesRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Gevents Unlimited Cricket API is healthy." });
});

// Initialize Socket.IO broadcast hooks
initSocket(server);

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("[Fatal Global Error Catch]:", err.stack || err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    details: err.message || "An unexpected error occurred in Gevents Cricket Ecosystem."
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Gevents Unlimited Cricket Server running on port ${PORT} `);
  console.log(` WebSocket server initialized & broadcast-ready! `);
  console.log(`=======================================================`);
});
