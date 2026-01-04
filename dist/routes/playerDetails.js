"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerDetails_controller_1 = require("../controllers/playerDetails.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get("/player-profile", auth_1.authenticate, playerDetails_controller_1.getPlayerProfile);
router.put("/player-profile", auth_1.authenticate, upload_1.upload.fields([
    { name: "playerLogoImage", maxCount: 1 },
    { name: "playerBannerImage", maxCount: 1 },
]), playerDetails_controller_1.updatePlayerProfile);
exports.default = router;
