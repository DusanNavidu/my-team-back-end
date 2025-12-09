import { Router } from "express"
import {
    createEvent,
    getAllEvents,
    getOrganizerEvents,
} from "../controllers/event.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"
import { upload } from "../middleware/upload"

const router = Router()

router.post(
    "/create",
    authenticate,
    requireRole([Role.ORGANIZER]),
    upload.fields([
        { name: "eventImage", maxCount: 1 }
    ]),
    createEvent
)

router.get(
    "/getall",
    authenticate,
    requireRole([Role.ORGANIZER, Role.PLAYER, Role.USER]),
    getAllEvents
)

router.get(
    "/my-events",
    authenticate,
    getOrganizerEvents // Function to filter by userId
)

export default router