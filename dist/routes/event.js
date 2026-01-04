"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const upload_1 = require("../middleware/upload");
const eventScheduler_1 = require("../middleware/eventScheduler");
// Start the event status scheduler when this module is loaded
(0, eventScheduler_1.startEventScheduler)();
const router = (0, express_1.Router)();
router.post("/create", auth_1.authenticate, 
// requireRole([Role.ORGANIZER]),
upload_1.upload.fields([
    { name: "eventImage", maxCount: 1 }
]), event_controller_1.createEvent);
router.get("/getall", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER, user_model_1.Role.USER]), event_controller_1.getAllEvents);
router.get("/my-events", auth_1.authenticate, event_controller_1.getOrganizerEvents // Function to filter by userId
);
// නව Route එක
router.get("/organizer/:organizerId", auth_1.authenticate, event_controller_1.getEventsByOrganizerId);
exports.default = router;
