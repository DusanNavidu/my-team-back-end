import { NextFunction, Response } from "express"
import { Role } from "../models/user.model"
import { AUthRequest } from "./auth"

export const requireRole = (roles: Role[]) => {
  return (req: AUthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    if (!req.user.roles?.some((role: Role) => roles.includes(role))) { // check if user has at least one of the required roles
      return res.status(403).json({
        message: `Require ${roles.join(", ")} role`
      })
    }
    next()
  }
}
// [].includes
