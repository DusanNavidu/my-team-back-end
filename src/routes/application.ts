import { requireRole } from "../middleware/role";
import { Role } from "../models/user.model";
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { 
    applyForEvent, 
    checkAppliedStatus,
    getOrganizerApplications,
    updateApplicationStatus
} from "../controllers/appliction.controller";

const router = Router()

router.post(
  "/apply/:eventId",
  authenticate,
  requireRole([Role.PLAYER]),
  applyForEvent
);

router.get(
  "/check-applied/:eventId",
  authenticate,
  requireRole([Role.PLAYER]),
  checkAppliedStatus
);

router.get(
    "/organizer",
    authenticate,
    requireRole([Role.ORGANIZER]),
    getOrganizerApplications
);

router.patch(
    "/update-status/:id",
    authenticate,
    requireRole([Role.ORGANIZER]),
    updateApplicationStatus
);

export default router;