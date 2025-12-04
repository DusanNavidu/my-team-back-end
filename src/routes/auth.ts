import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  registerAdmin,
  roleUpdate,
  registerUser
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

// login - public
router.post("/login", login)

// refresh token -public

router.post("/refresh" , refreshToken )

// register (ADMIN) - Admin only
router.post(
  "/admin/register",
  authenticate,
  requireRole([Role.ADMIN]),
  registerAdmin
)

router.post("/roleupdate", authenticate, roleUpdate);

// me - Admin or User both
router.get("/me", authenticate, getMyProfile)

// router.get("/test", authenticate, () => {})

export default router
