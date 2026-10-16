import { Server } from "socket.io";

let io = null;

/**
 * Initialize Socket.io server with CORS
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN || "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    // Join event room for live leaderboard and announcements
    socket.on("join:event", (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}`);
      }
    });

    socket.on("leave:event", (eventId) => {
      if (eventId) {
        socket.leave(`event:${eventId}`);
      }
    });

    // Join team room for real-time team updates
    socket.on("join:team", (teamId) => {
      if (teamId) {
        socket.join(`team:${teamId}`);
      }
    });

    socket.on("leave:team", (teamId) => {
      if (teamId) {
        socket.leave(`team:${teamId}`);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

/**
 * Get active Socket.io instance
 */
export const getIO = () => {
  return io;
};

/**
 * Emit live leaderboard update to an event room
 * @param {string} eventId
 * @param {Array} leaderboardData
 */
export const emitLeaderboardUpdate = (eventId, leaderboardData) => {
  if (io && eventId) {
    io.to(`event:${eventId}`).emit("leaderboard:update", leaderboardData);
  }
};

/**
 * Emit announcement to an event room
 * @param {string} eventId
 * @param {Object} announcement
 */
export const emitAnnouncement = (eventId, announcement) => {
  if (io && eventId) {
    io.to(`event:${eventId}`).emit("announcement:broadcast", announcement);
  }
};

/**
 * Emit team member or submission update to a team room
 * @param {string} teamId
 * @param {Object} teamData
 */
export const emitTeamUpdate = (teamId, teamData) => {
  if (io && teamId) {
    io.to(`team:${teamId}`).emit("team:update", teamData);
  }
};
