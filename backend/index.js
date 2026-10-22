import http from "http";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { initSocket } from "./socket.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Import all routes
import authRouter from "./routes/auth.routes.js";
import festRouter from "./routes/fest.routes.js";
import eventRouter from "./routes/event.routes.js";
import teamRouter from "./routes/team.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import evaluationRouter from "./routes/evaluation.routes.js";

dotenv.config();

// Startup validation for critical security secrets
const requiredEnvSecrets = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
const missingEnvSecrets = requiredEnvSecrets.filter((key) => !process.env[key]);
if (missingEnvSecrets.length > 0) {
  const errMsg = `[CRITICAL SECURITY CONFIG] Missing mandatory environment variable(s): ${missingEnvSecrets.join(", ")}`;
  console.error(errMsg);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);

// Enable trust proxy for cloud hosting (Render, AWS, Cloudflare)
app.set("trust proxy", 1);

// Configure allowed CORS origins
const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://stage-zero-three.vercel.app",
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

export const isAllowedOrigin = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Vercel preview or production deployments
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin)) {
    return true;
  }
  // In development, allow any localhost/127.0.0.1 port (e.g. Vite auto-incremented port)
  if (process.env.NODE_ENV !== "production") {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
};

// Initialize Socket.io with strict origin validation
initSocket(server, isAllowedOrigin);

// Security & utility middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // relaxed for hackathon platform live scoring
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "StageZero API Engine",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/fests", festRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/evaluations", evaluationRouter);

// Centralized error handling
app.use(errorHandler);

// Database connection & Server start
const PORT = process.env.PORT || 8000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/festflow";

mongoose.connection.on("connected", () => {
  console.log(" Mongoose successfully connected to MongoDB Cluster");
});

mongoose.connection.on("error", (err) => {
  console.error(" Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn(" Mongoose disconnected from MongoDB. Reconnecting...");
  setTimeout(connectDB, 2000);
});

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(MONGO_URI, {
      family: 4, // Force IPv4 to prevent macOS IPv6 DNS lookup delays
      maxPoolSize: 20, // Scaled for high concurrency without exceeding Atlas M0 limits
      minPoolSize: 1, // Keep 1 socket alive to prevent cold connect delays
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(
      ` MongoDB Connected! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(" MongoDB Connection Failed: ", error.message);
    console.log(" Retrying MongoDB connection in 2 seconds...");
    setTimeout(connectDB, 2000);
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(` StageZero Server & Socket.io running on http://localhost:${PORT}`);
  });
});

export { app, server };
