"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizer_controller_1 = require("../controllers/organizer.controller");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const upload_1 = require("../middleware/upload");
const event_controller_1 = require("../controllers/event.controller");
const router = (0, express_1.Router)();
router.post("/create", auth_1.authenticate, 
// requireRole([Role.ORGANIZER]),
upload_1.upload.fields([
    { name: "committeeLogoImage", maxCount: 1 },
    { name: "committeeBannerImage", maxCount: 1 }
]), organizer_controller_1.createOrganizer);
router.get("/me", auth_1.authenticate, organizer_controller_1.getMyOrganizerDetails);
router.put("/update", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER]), upload_1.upload.fields([
    { name: "committeeLogoImage", maxCount: 1 },
    { name: "committeeBannerImage", maxCount: 1 }
]), organizer_controller_1.updateOrganizer);
router.get("/organizer/:organizerId", auth_1.authenticate, event_controller_1.getEventsByOrganizerId);
exports.default = router;
