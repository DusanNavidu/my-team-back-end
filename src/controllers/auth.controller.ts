import { Request, Response } from "express"
import { IUSER, Role, User } from "../models/user.model"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "../utils/tokens"
import { AUthRequest } from "../middleware/auth"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {fullname, email, password } = req.body

    // left email form model, right side data varible
    //   User.findOne({ email: email })
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    //   new User()
    const user = await User.create({
      fullname,
      email,
      password: hash,
      roles: [Role.USER]
    })

    res.status(201).json({
      message: "User registed",
      data: { email: user.email, roles: user.roles }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal; server error"
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = (await User.findOne({ email })) as IUSER | null
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, existingUser.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(existingUser)
    const refreshToken = signRefreshToken(existingUser)

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken,
        refreshToken
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal; server error"
    })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: "Token required" })
    }

    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" })
    }
    const accessToken = signAccessToken(user)

    res.status(200).json({
      accessToken
    })
  } catch (err) {
    res.status(403).json({ message: "Invalid or expire token" })
  }
}

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await User.create({
      email,
      password: hash,
      roles: [Role.ADMIN]
    })

    res.status(201).json({
      message: "Admin registed",
      data: { email: user.email, roles: user.roles }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const getMyProfile = async (req: AUthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const user = await User.findById(req.user.sub).select("-password")

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const { fullname, email, roles, _id } = user as IUSER

  res.status(200).json({ message: "ok", data: { id: _id, email, roles, fullname } })
}

export const roleUpdate = async (req: AUthRequest, res: Response) => {
    try {
        const { role } = req.body; 
        const userId = req.user.sub; 

        if (!userId) {
            console.error("RoleUpdate Error: Missing user ID in token."); // LOG
            return res.status(401).json({ message: "Unauthorized or missing user context." });
        }
        
        const currentUser = await User.findById(userId).select('roles');
        if (currentUser) {
            console.log(`[Role Update] User ID ${userId}: Current Roles: ${currentUser.roles}`); // LOG
            console.log(`[Role Update] Requesting Role Change to: ${role}`); // LOG
        }

        if (!Object.values(Role).includes(role)) {
            return res.status(400).json({ message: "Invalid role provided." });
        }
        
        const updateQuery = { $set: { roles: [role] } }; 
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateQuery,
            { new: true, select: "-password" }
        ) as IUSER | null;

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        
        console.log(`[Role Update] Success! New Roles in DB: ${updatedUser.roles}`); // LOG

        const newAccessToken = signAccessToken(updatedUser);
        
        res.status(200).json({
            message: `User role successfully set to ${role}`,
            data: { 
                email: updatedUser.email, 
                roles: updatedUser.roles,
                accessToken: newAccessToken
            }
        });

    } catch (err) {
        console.error(`[Role Update] Failed for User ${req.user.sub}:`, err); // LOG
        res.status(500).json({ message: "Failed to update user role." });
    }
};

export const getRole = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user.sub;
        
        // Database එකෙන් user ගේ roles පමණක් retrieve කිරීම
        const user = await User.findById(userId).select("roles");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log(`[Get Role] User ID ${userId} requested roles: ${user.roles}`); // LOG

        res.status(200).json({
            message: "User roles retrieved successfully",
            data: { 
                roles: user.roles 
            }
        });

    } catch (err) {
        console.error("[Get Role] Internal server error:", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}