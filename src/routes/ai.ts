import { Router } from "express";
import { generateContent } from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth";

const router = Router()

router.post("/generate" , generateContent)

export default router