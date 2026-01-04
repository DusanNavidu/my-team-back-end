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
import { createDefaultAdmin } from "./utils/createDefaultAdmin"

dotenv.config()

const app = express()
const MONGO_URI = process.env.MONGO_URI as string

// 1. Manual CORS Headers (මෙය මුලින්ම තිබිය යුතුය)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = ["https://my-team-front-end-seven.vercel.app", "http://localhost:5173", "http://localhost:5174"];
    
    if (origin && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.header("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(express.json())

// 2. Standard CORS Middleware
app.use(
    cors({
        origin: ["https://my-team-front-end-seven.vercel.app", "http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
)

// 3. DB Connection Logic
let isConnected = false;
const connectToDatabase = async () => {
    if (isConnected) return;
    try {
        if (!MONGO_URI) throw new Error("MONGO_URI is missing");
        await mongoose.connect(MONGO_URI);
        isConnected = true;
        console.log("✅ MongoDB Connected");
        await createDefaultAdmin();
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

// 4. Routes (CORS වලට පසුව තිබිය යුතුය)
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/organizer", organizerRouter)
app.use("/api/v1/event", eventRouter)
app.use("/api/v1/player", playerRouter)
app.use("/api/v1/post", post)
app.use("/api/v1/applications", applicationRouter)

app.get("/", (req, res) => {
    res.send("Backend is running on Vercel...")
})

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Local Server running on port ${PORT}`);
    });
}

export default app;