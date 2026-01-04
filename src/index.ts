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

dotenv.config();

const app = express();
const MONGO_URI = process.env.MONGO_URI as string;

// CORS - Vercel සඳහා credentials true සහ optionsSuccessStatus එකතු කරන්න
app.use(
  cors({
    origin: ["https://my-team-front-end-seven.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204
  })
);

app.use(express.json());

// Database connection logic (Cached connection)
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log("✅ DB connected");
  } catch (err) {
    console.error("❌ DB error:", err);
  }
};

// Middleware to connect to DB on every request (Serverless සඳහා)
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizer", organizerRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/player", playerRouter);
app.use("/api/v1/post", post);
app.use("/api/v1/applications", applicationRouter);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Vercel එකේදී app.listen අවශ්‍ය නැත. 
// local test කිරීමට පමණක් මෙය පාවිච්චි කරන්න:
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// මෙය අනිවාර්යයි!
export default app;