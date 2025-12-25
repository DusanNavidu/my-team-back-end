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
  getAllOrganizers,
  getAllUsersByRole,
  getAllPlayers,
  getAllactiveUsers,
  getAllDeactiveUsers,
  getAllUsersCount,
  getAllDeactiveUsersCount,
  getAllActiveUsersCount,
  getAllPlayersCount,
  getAllOrganizersCount,
  searchUsers,
  getAllUsersByRoleCount,
  roleUpdateToPlayer,
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
  
router.get(
  "/admin/getallorganizers", 
  authenticate, 
  requireRole([Role.ADMIN]), 
  getAllOrganizers
);

router.get(
  "/admin/getallusersbyrole", 
  authenticate, 
  requireRole([Role.ADMIN]), 
  getAllUsersByRole
);

router.get(
  "/admin/getallplayers",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllPlayers
);

router.get(
  "/admin/getallactiveusers",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllactiveUsers
)

router.get(
  "/admin/getalldeactivatedusers",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllDeactiveUsers
);

router.get(
  "/admin/search",
  authenticate,
  requireRole([Role.ADMIN]),
  searchUsers
);

router.get(
  "/admin/getalluserscount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllUsersCount
);

router.get(
  "/admin/getallorganizerscount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllOrganizersCount
);

router.get(
  "/admin/getallplayerscount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllPlayersCount
);

router.get(
  "/admin/getallusersbyrolecount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllUsersByRoleCount
);

router.get(
  "/admin/getallactiveuserscount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllActiveUsersCount
);

router.get(
  "/admin/getalldeactivateduserscount",
  authenticate,
  requireRole([Role.ADMIN]),
  getAllDeactiveUsersCount
);

router.put(
  "/admin/user/:userId",
  authenticate,
  requireRole([Role.ADMIN]),
  updateUser
);

router.put(
  "/admin/user/:userId/status", 
  authenticate, 
  requireRole([Role.ADMIN]), 
  changeUserStatus
);

router.post(
  "/roleupdate", 
  authenticate, 
  roleUpdate
);

router.get(
  "/me", 
  authenticate, 
  getMyProfile
);

router.get(
  "/role", 
  authenticate, 
  getRole
);

router.put(
  "/roleUpdate/player/:userId",
  authenticate,
  roleUpdateToPlayer
);

export default router