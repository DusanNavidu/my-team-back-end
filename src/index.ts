// src/index.ts

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRouter from "./routes/auth"
import organizerRouter from "./routes/organizer"
import aiRouter from "./routes/ai"
import { authenticate } from "./middleware/auth"
import { requireRole } from "./middleware/role"
import { Role } from "./models/user.model"
dotenv.config()

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI as string

const app = express()

app.use(express.json())
app.use(
    cors({
        origin: ["http://localhost:5173","http://localhost:5174","https://rad-72-sample-fe.vercel.app/login"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    })
)

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/ai", aiRouter)
app.use("/api/v1/organizer", organizerRouter)

app.get("/", (req, res) => {
    res.send("Backend is running...")
})

app.get("/test-1", (req, res) => {})

app.get("/test-2", authenticate, (req, res) => {})

app.get("/test-3", authenticate, requireRole([Role.ADMIN]), (req, res) => {})

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("DB connected")
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })

app.listen(PORT, () => {
    console.log("Server is running")
})