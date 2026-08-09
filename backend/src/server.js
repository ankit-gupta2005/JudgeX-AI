require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Redis = require("ioredis");

const connectDatabase = require("./config/db");
const redisClient = require("./config/redis");
const contestRoutes = require("./routes/contest.routes");
const aiRoutes = require("./routes/ai.routes");
const healthRoutes = require("./routes/health.Route");
const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/org.route");
const problemRoutes = require("./routes/problem.routes");
const submissionRoutes = require("./routes/submission.route");
const dashboardRoutes = require("./routes/dashboard.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

const redisSubscriber = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDatabase();

redisClient.on("connect", () => {
  console.log("Memory Store Matrix: Redis Connection Verified...");
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Requested API Endpoint Not Found",
  });
});

redisSubscriber.subscribe(
  "submission_channel",
  "contest_leaderboard_channel",
  "dryrun_channel",
  (err) => {
    if (err) {
      console.error(
        "Failed to subscribe to Redis process channel:",
        err.message
      );
    } else {
      console.log(
        "Redis Pipeline Subscriber: Active on submission_channel, contest_leaderboard_channel & dryrun_channel..."
      );
    }
  }
);

redisSubscriber.on("message", (channel, message) => {
  try {
    const payload = JSON.parse(message);

    if (channel === "submission_channel") {
      io.to(payload.problemId).emit("submission_update", payload);
    } else if (channel === "contest_leaderboard_channel") {
      io.to(`contest:${payload.contestId}`).emit(
        "leaderboard_update",
        payload
      );
    } else if (channel === "dryrun_channel") {
      io.to(payload.problemId).emit("dry_run_update", payload);
    }
  } catch (parseErr) {
    console.error(
      "Malformed Redis broadcast trace packet rejected:",
      parseErr.message
    );
  }
});

io.on("connection", (socket) => {
  console.log(`Active Live Streaming Node Engaged: ${socket.id}`);

  socket.on("join_workspace", (data) => {
    if (data.problemId) {
      socket.join(data.problemId);
      console.log(
        `Node ${socket.id} locked to Workspace Room: ${data.problemId}`
      );
    }
  });

  socket.on("join_contest_room", (data) => {
    if (data.contestId) {
      socket.join(`contest:${data.contestId}`);
      console.log(
        `Node ${socket.id} locked to Contest Room: ${data.contestId}`
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`Live Streaming Node Terminated: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`JudgeX Core API Server is Live on Port ${PORT}`);
});