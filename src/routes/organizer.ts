import { Router } from "express"
import {
    createOrganizer,
    getMyOrganizerDetails,
    getOrganizerDetailsVisitor,
    updateOrganizer,
} from "../controllers/organizer.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"
import { upload } from "../middleware/upload"
import { getEventsByOrganizerId } from "../controllers/event.controller"

const router = Router()

router.post(
    "/create",
    authenticate,
    // requireRole([Role.ORGANIZER]),
    upload.fields([
        { name: "committeeLogoImage", maxCount: 1 },
        { name: "committeeBannerImage", maxCount: 1 }
    ]),
    createOrganizer
)

router.get(
    "/me",
    authenticate,
    getMyOrganizerDetails
);

router.put(
    "/update",
    authenticate,
    requireRole([Role.ORGANIZER]),
    upload.fields([
        { name: "committeeLogoImage", maxCount: 1 },
        { name: "committeeBannerImage", maxCount: 1 }
    ]),
    updateOrganizer
)

router.get(
    "/organizer/:organizerId",
    authenticate,
    getEventsByOrganizerId
);

export default router