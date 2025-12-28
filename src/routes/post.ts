import { Router } from "express";
import { createPost, getMePosts } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { requireRole } from "../middleware/role";
import { Role } from "../models/user.model";

const router = Router();

router.post(
    "/create-post",
    authenticate,
    upload.fields([
        { name: "postImage", maxCount: 1 },
    ]),
    createPost
);

router.get(
    "/getmeposts",
    authenticate,
    getMePosts,
    requireRole([Role.ORGANIZER]),
);

export default router;