import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import next from "next";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./socket.js";
import authRouter from "./routes/auth.js";
import tournamentRouter from "./routes/tournaments.js";
import matchesRouter from "./routes/matches.js";

// Load environment configurations
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;
const isProd = process.env.NODE_ENV === "production";

// Global Middleware Configs
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Route Groupings (Compatible with both /api and /scoring/api subpath)
app.use(["/api/auth", "/scoring/api/auth"], authRouter);
app.use(["/api/tournaments", "/scoring/api/tournaments"], tournamentRouter);
app.use(["/api/matches", "/scoring/api/matches"], matchesRouter);

// Health check endpoint
app.get(["/health", "/scoring/health"], (req, res) => {
  res.json({ success: true, message: "Gevents Unlimited Cricket API is healthy." });
});

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("[Fatal Global Error Catch]:", err.stack || err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    details: err.message || "An unexpected error occurred in Gevents Cricket Ecosystem."
  });
});

if (isProd) {
  console.log(`=======================================================`);
  console.log(`[Production Mode] Initializing Unified Next.js Custom Server...`);
  console.log(`=======================================================`);
  
  const nextApp = next({
    dev: false,
    dir: path.join(__dirname, "../frontend"),
    hostname: "localhost",
    port: parseInt(PORT, 10)
  });
  
  const handle = nextApp.getRequestHandler();
  
  nextApp.prepare().then(() => {
    // Initialize Socket.IO with production path prefix
    initSocket(server);
    
    // Route Next.js pages for everything else
    app.all("*", (req, res) => {
      return handle(req, res);
    });
    
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Unified Production Server running on port ${PORT} `);
      console.log(` Socket.IO path: /scoring/socket.io `);
      console.log(` Next.js basePath: /scoring `);
      console.log(`=======================================================`);
    });
  }).catch(err => {
    console.error("Unified Custom Server failed to start:", err);
  });
} else {
  // Local development mode: Only boot Express backend API (Next HMR runs on port 3000)
  initSocket(server);
  
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Dev Backend Server running on port ${PORT} `);
    console.log(` WebSocket server initialized & broadcast-ready! `);
    console.log(`=======================================================`);
  });
}
