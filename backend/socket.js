import { Server } from "socket.io";

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`New real-time client connected: ${socket.id}`);

    // Join a specific match stream
    socket.on("join_match", (matchId) => {
      socket.join(`match_${matchId}`);
      console.log(`Socket ${socket.id} subscribed to live match updates for ID: ${matchId}`);
    });

    // Leave a specific match stream
    socket.on("leave_match", (matchId) => {
      socket.leave(`match_${matchId}`);
      console.log(`Socket ${socket.id} unsubscribed from match ID: ${matchId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Real-time client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Global broadcast score updates helper
export function broadcastScoreUpdate(matchId, scoreData) {
  if (io) {
    io.to(`match_${matchId}`).emit("score_update", scoreData);
    io.emit("global_live_update", { matchId, scoreData });
  }
}

// Global broadcast ball-by-ball commentary helper
export function broadcastCommentary(matchId, commentaryData) {
  if (io) {
    io.to(`match_${matchId}`).emit("commentary_update", commentaryData);
  }
}

// Global system notification broadcasts
export function broadcastAnnouncement(message) {
  if (io) {
    io.emit("announcement", { message, timestamp: new Date().toISOString() });
  }
}
