import { Router } from "express";
import { 
    createPost, 
    getMePosts, 
    getMyStory, 
    getTenLatestStories,
    getAllPosts,
    deletePost,
    getPlayerPostsById,
    toggleLikePost
} from "../controllers/post.controller";
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
    requireRole([Role.ORGANIZER, Role.PLAYER]),
);

router.get(
    "/getmestory",
    authenticate,
    getMyStory,
    requireRole([Role.ORGANIZER, Role.PLAYER]),
);

router.get(
    "/gettenlateststories",
    authenticate,
    getTenLatestStories,
    requireRole([Role.ORGANIZER, Role.PLAYER, Role.USER]),
);

router.get(
    "/getallposts",
    authenticate,
    getAllPosts,
    requireRole([Role.ORGANIZER, Role.PLAYER, Role.USER]),
);

router.delete(
    "/delete/:id",
    authenticate, 
    requireRole([Role.ORGANIZER, Role.PLAYER]),
    deletePost
);

router.get(
  "/player/:id",
  authenticate,
  requireRole([Role.ORGANIZER, Role.PLAYER, Role.USER, Role.ADMIN]),
  getPlayerPostsById
);

router.put(
    "/like/:postId",
    authenticate,
    requireRole([Role.ORGANIZER, Role.PLAYER, Role.USER]),
    toggleLikePost
)

export default router;