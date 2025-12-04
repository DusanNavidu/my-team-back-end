"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
// register (only USER) - public
router.post("/register", auth_controller_1.registerUser);
// login - public
router.post("/login", auth_controller_1.login);
// refresh token -public
router.post("/refresh", auth_controller_1.refreshToken);
// register (ADMIN) - Admin only
router.post("/admin/register", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), auth_controller_1.registerAdmin);
// me - Admin or User both
router.get("/me", auth_1.authenticate, auth_controller_1.getMyProfile);
// router.get("/test", authenticate, () => {})
exports.default = router;
