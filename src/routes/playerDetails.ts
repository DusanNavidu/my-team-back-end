import { Router } from "express";
import { updatePlayerProfile, getPlayerProfile } from "../controllers/playerDetails.controller";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/player-profile", authenticate, getPlayerProfile);
router.put(
  "/player-profile",
  authenticate,
  upload.fields([
    { name: "playerLogoImage", maxCount: 1 },
    { name: "playerBannerImage", maxCount: 1 },
  ]),
  updatePlayerProfile
);

export default router;