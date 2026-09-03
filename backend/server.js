import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoute.js";
import studentRoutes from "./routes/studentsRoute.js";
import attendanceRouter from "./routes/attendanceRoute.js";;
import faceRoutes from "./routes/faceRoute.js";
import ipRoutes from "./routes/ipRoutes.js"

import { connectDB } from "./config/db.js";
import { defultAdmin, createDefaultStudent } from "./controllers/authController.js";
import { initSocketServer } from "./utils/socket.js";
// import { loadModels } from "./utils/faceModels.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// await loadModels();


// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRouter);
app.use("/api/face", faceRoutes);
app.use("/api/ip", ipRoutes);

// home route
app.get("/", (req, res) => {
  res.send("this is home");
});

// login test route
app.get("/login", (req, res) => {
  res.send("this is login");
});

// connect database and initialize the default admin account
const startServer = async () => {
  try {
    await connectDB();
    await defultAdmin();
    await createDefaultStudent();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    initSocketServer(server);

    server.on("error", (err) => {
      console.error("Server failed to start:", err.message);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
  }
};

startServer();
