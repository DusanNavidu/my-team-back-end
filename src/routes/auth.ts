import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  registerAdmin,
  roleUpdate,
  registerUser,
  getRole
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = Router()

router.post("/register", registerUser)

router.post("/login", login)

router.post("/refresh" , refreshToken )

router.post(
  "/admin/register",
  authenticate,
  requireRole([Role.ADMIN]),
  registerAdmin
)

router.post("/roleupdate", authenticate, roleUpdate);

router.get("/me", authenticate, getMyProfile)

router.get("/role", authenticate, getRole)

export default router
