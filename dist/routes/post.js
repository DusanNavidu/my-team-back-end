"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// only for Authors
router.post("/create", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.AUTHOR, user_model_1.Role.ADMIN]), upload_1.upload.single("image"), // form data key name
post_controller_1.createPost);
router.get("/", post_controller_1.getAllPost);
router.get("/me", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.AUTHOR, user_model_1.Role.ADMIN]), post_controller_1.getMyPost);
exports.default = router;
