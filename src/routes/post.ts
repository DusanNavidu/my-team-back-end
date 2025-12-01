import { Router } from "express"
import {
  createPost,
  getAllPost,
  getMyPost
} from "../controllers/post.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"
import { upload } from "../middleware/upload"

const router = Router()

// only for Authors
router.post(
  "/create",
  authenticate,
  requireRole([Role.AUTHOR , Role.ADMIN]),
  upload.single("image"), // form data key name
  createPost
)

router.get("/", getAllPost)

router.get("/me", authenticate, requireRole([Role.AUTHOR, Role.ADMIN]), getMyPost)

export default router
