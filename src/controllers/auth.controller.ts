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
        const { role } = req.body; // අපේක්ෂිත නව role එක (උදා: 'ORGANIZER')

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized or missing user context." });
        }

        // 💡 1. නව role එක වලංගු (valid) ද යන්න පරීක්ෂා කිරීම
        if (!Object.values(Role).includes(role)) {
            return res.status(400).json({ message: "Invalid role provided." });
        }
        
        // 💡 2. User ගේ current roles වලට නව role එක එකතු කිරීම (Array එකක් ලෙස)
        // Set Operators භාවිතයෙන් array එකක් තුළ නැවත එම role එකම duplicate වීම වළක්වයි.
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { roles: role } }, // $addToSet: අලුත් role එකක් එකතු කරයි, නමුත් duplicate කරන්නේ නැත.
            { new: true, select: "-password" }
        ) as IUSER | null;

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // 💡 3. නව JWT Token නිකුත් කිරීම
        // Role එක වෙනස් වූ නිසා, නව role එක සහිත නව accessToken එකක් අවශ්‍ය වේ.
        const newAccessToken = signAccessToken(updatedUser);
        
        res.status(200).json({
            message: `User role successfully updated to include ${role}`,
            data: { 
                email: updatedUser.email, 
                roles: updatedUser.roles,
                accessToken: newAccessToken // නව token එක frontend වෙත යැවීම
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update user role." });
    }
};