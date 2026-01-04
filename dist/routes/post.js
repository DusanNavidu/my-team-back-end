"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const role_1 = require("../middleware/role");
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
router.post("/create-post", auth_1.authenticate, upload_1.upload.fields([
    { name: "postImage", maxCount: 1 },
]), post_controller_1.createPost);
router.get("/getmeposts", auth_1.authenticate, post_controller_1.getMePosts, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER]));
router.get("/getmestory", auth_1.authenticate, post_controller_1.getMyStory, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER]));
router.get("/gettenlateststories", auth_1.authenticate, post_controller_1.getTenLatestStories, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER, user_model_1.Role.USER]));
router.get("/getallposts", auth_1.authenticate, post_controller_1.getAllPosts, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER, user_model_1.Role.USER]));
router.delete("/delete/:id", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER]), post_controller_1.deletePost);
router.get("/player/:id", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER, user_model_1.Role.USER, user_model_1.Role.ADMIN]), post_controller_1.getPlayerPostsById);
router.put("/like/:postId", auth_1.authenticate, (0, role_1.requireRole)([user_model_1.Role.ORGANIZER, user_model_1.Role.PLAYER, user_model_1.Role.USER]), post_controller_1.toggleLikePost);
exports.default = router;
