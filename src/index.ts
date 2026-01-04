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

// 1. CORS Setup - මේක හැමදේටම කලින් තියෙන්න ඕනේ
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "https://my-team-front-end-seven.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Body Parser Middleware
app.use(express.json());

// 3. Database Connection Logic
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

// 4. DB Connection Middleware (Preflight requests skip කරනවා)
app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    await connectToDatabase();
    next();
});

// 5. Routes setup
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

// Vercel එකට අත්‍යවශ්‍ය export එක
export default app;