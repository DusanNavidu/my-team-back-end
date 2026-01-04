// src/index.ts

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRouter from "./routes/auth"
import organizerRouter from "./routes/organizer"
import eventRouter from "./routes/event"
import playerRouter from "./routes/playerDetails"
import post from "./routes/post"
import applicationRouter from "./routes/application"
import { authenticate } from "./middleware/auth"
import { requireRole } from "./middleware/role"
import { Role } from "./models/user.model"
import { createDefaultAdmin } from "./utils/createDefaultAdmin"

dotenv.config()

const app = express()

// MONGO_URI එක Environment Variables වලින් ලබා ගැනීම
const MONGO_URI = process.env.MONGO_URI as string

app.use(express.json())

// CORS Configuration
app.use(
    cors({
        origin: [
            "https://my-team-front-end-seven.vercel.app", // අන්තිමට / දාන්න එපා
            "http://localhost:5173",
            "http://localhost:5174"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
)

// Pre-flight requests සඳහා අනිවාර්යයෙන්ම මෙය ඇතුළත් කරන්න
app.options("*", cors());

// Routes setup
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/organizer", organizerRouter)
app.use("/api/v1/event", eventRouter)
app.use("/api/v1/player", playerRouter)
app.use("/api/v1/post", post)
app.use("/api/v1/applications", applicationRouter)

app.get("/", (req, res) => {
    res.send("Backend is running on Vercel...")
})

// Database Connection Logic (Vercel Serverless සඳහා ප්‍රශස්ත කළ එකක්)
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

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

// Local development එකට පමණක් listen පාවිච්චි කරන්න
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Local Server running on port ${PORT}`);
    });
}

// Vercel එකට අත්‍යවශ්‍ය export එක
export default app;