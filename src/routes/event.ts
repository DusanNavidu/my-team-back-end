import { Router } from "express"
import {
    createEvent,
    getAllEvents,
    getEventsByOrganizerId,
    getOrganizerEvents,
} from "../controllers/event.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"
import { upload } from "../middleware/upload"
import { startEventScheduler } from "../middleware/eventScheduler";

// Start the event status scheduler when this module is loaded
startEventScheduler();

const router = Router()

router.post(
    "/create",
    authenticate,
    // requireRole([Role.ORGANIZER]),
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

// නව Route එක
router.get(
    "/organizer/:organizerId",
    authenticate,
    getEventsByOrganizerId
);

export default router