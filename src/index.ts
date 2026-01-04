// src/index.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRouter from "./routes/auth";
import organizerRouter from "./routes/organizer";
import eventRouter from "./routes/event";
import playerRouter from "./routes/playerDetails";
import post from "./routes/post";
import applicationRouter from "./routes/application";
import aiRouter from "./routes/ai";
import { createDefaultAdmin } from "./utils/createDefaultAdmin";

dotenv.config();

const app = express();
const MONGO_URI = process.env.MONGO_URI as string;

app.use(express.json());

// CORS Settings - Frontend එක සම්බන්ධ කිරීමට
app.use(
    cors({
        origin: [
            "http://localhost:5173", 
            "http://localhost:5174", 
            "https://my-team-front-end-seven.vercel.app" // ඔයාගේ Frontend එකේ Deployment URL එක
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    })
);

// Routes setup
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/organizer", organizerRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/player", playerRouter);
app.use("/api/v1/post", post);
app.use("/api/v1/applications", applicationRouter);

app.get("/", (req, res) => {
    res.send("Backend is running on Vercel...");
});

// Database Connection
let isConnected = false;
const connectToDatabase = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGO_URI);
        isConnected = true;
        console.log("✅ MongoDB Connected");
        await createDefaultAdmin();
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
};

app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

export default app;