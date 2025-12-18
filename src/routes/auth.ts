import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  registerAdmin,
  roleUpdate,
  registerUser,
  getRole,
  getAllUsers,
  updateUser,
  changeUserStatus,
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

router.get(
  "/admin/getallusers", 
  authenticate, 
  requireRole([Role.ADMIN]), 
  getAllUsers
);

router.put(
  "/admin/user/:userId",
  authenticate,
  requireRole([Role.ADMIN]),
  updateUser
);

router.put("/admin/user/:userId/status", authenticate, requireRole([Role.ADMIN]), changeUserStatus);

router.post("/roleupdate", authenticate, roleUpdate);

router.get("/me", authenticate, getMyProfile)

router.get("/role", authenticate, getRole)

export default router