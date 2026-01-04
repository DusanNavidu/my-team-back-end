import { Request, Response } from "express";
import { IUSER, Role, Status, User } from "../models/user.model";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../utils/tokens";
import { AUthRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      password: hash,
      roles: [Role.USER],
    });

    res.status(201).json({
      message: "User registed",
      data: { email: user.email, roles: user.roles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal; server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log("Login attempt:", req.body);
  try {
    const { email, password } = req.body;

    const existingUser = (await User.findOne({ email })) as IUSER | null;
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, existingUser.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (existingUser.status !== Status.ACTIVE) {
      return res.status(403).json({ message: "User is not active" });
    }

    const accessToken = signAccessToken(existingUser);
    const refreshToken = signRefreshToken(existingUser);

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal; server error",
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const accessToken = signAccessToken(user);

    res.status(200).json({
      accessToken,
    });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expire token" });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      roles: [Role.ADMIN],
    });

    res.status(201).json({
      message: "Admin registed",
      data: { email: user.email, roles: user.roles },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMyProfile = async (req: AUthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await User.findById(req.user.sub).select("-password");

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const { fullname, email, roles, _id } = user as IUSER;

  res
    .status(200)
    .json({ message: "ok", data: { id: _id, email, roles, fullname } });
};

export const roleUpdate = async (req: AUthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.user.sub;

    if (!userId) {
      console.error("RoleUpdate Error: Missing user ID in token.");
      return res
        .status(401)
        .json({ message: "Unauthorized or missing user context." });
    }

    const currentUser = await User.findById(userId).select("roles");
    if (currentUser) {
      console.log(
        `[Role Update] User ID ${userId}: Current Roles: ${currentUser.roles}`
      );
      console.log(`[Role Update] Requesting Role Change to: ${role}`);
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    const updateQuery = { $set: { roles: [role] } };

    const updatedUser = (await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      select: "-password",
    })) as IUSER | null;

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    console.log(`[Role Update] Success! New Roles in DB: ${updatedUser.roles}`);

    const newAccessToken = signAccessToken(updatedUser);

    res.status(200).json({
      message: `User role successfully set to ${role}`,
      data: {
        email: updatedUser.email,
        roles: updatedUser.roles,
        accessToken: newAccessToken,
      },
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

    const user = await User.findById(userId).select("roles");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`[Get Role] User ID ${userId} requested roles: ${user.roles}`); // LOG

    res.status(200).json({
      message: "User roles retrieved successfully",
      data: {
        roles: user.roles,
      },
    });
  } catch (err) {
    console.error("[Get Role] Internal server error:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { roles: { $ne: Role.ADMIN } };

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        totalUsers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOrganizers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { roles: Role.ORGANIZER };

    const organizers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Organizers retrieved successfully",
      data: organizers,
      pagination: {
        totalOrganizers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { roles: Role.PLAYER };

    const players = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Players retrieved successfully",
      data: players,
      pagination: {
        totalPlayers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsersByRole = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { roles: Role.USER };

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        totalUsers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllactiveUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { status: Status.ACTIVE, roles: { $ne: Role.ADMIN } };

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);

    res.status(200).json({
      message: "Active users retrieved successfully",
      data: users,
      pagination: {
        totalUsers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  }
  catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getAllDeactiveUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { status: Status.DEACTIVE, roles: { $ne: Role.ADMIN } };

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      message: "Deactive users retrieved successfully",
      data: users,
      pagination: {
        totalUsers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const searchQuery = {
      $and: [
        { roles: { $ne: Role.ADMIN } },
        {
          $or: [
            { fullname: { $regex: query as string, $options: "i" } },
            { email: { $regex: query as string, $options: "i" } },
          ],
        },
      ],
    };
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        totalUsers: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsersCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({});
    res.status(200).json({
      message: "Total users count retrieved successfully",
      data: { totalUsers: total },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOrganizersCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({ roles: Role.ORGANIZER });
    res.status(200).json({
      message: "Total organizers count retrieved successfully",
      data: { totalOrganizers: total },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPlayersCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({ roles: Role.PLAYER });
    res.status(200).json({
      message: "Total players count retrieved successfully",
      data: {totalPlayers: total},
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsersByRoleCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({ roles: Role.USER });
    res.status(200).json({
      message: "Total users count retrieved successfully",
      data: { totalUsersByRole: total },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllActiveUsersCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({ status: Status.ACTIVE });
    res.status(200).json({
      message: "Total active users count retrieved successfully",
      data: { totalActiveUsers: total },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllDeactiveUsersCount = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments({ status: Status.DEACTIVE });
    res.status(200).json({
      message: "Total deactive users count retrieved successfully",
      data: { totalDeactiveUsers: total },
    })
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { fullname, email, status, roles } = req.body;

    const updateData: any = {};

    if (fullname !== undefined) updateData.fullname = fullname;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;
    if (roles !== undefined) updateData.roles = roles;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("UpdateUser Error:", err);
    res.status(500).json({
      message: "Failed to update user",
    });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { roles } = req.body; // roles: ["ADMIN"] | ["USER"] | ["PLAYER"]

    if (
      !roles ||
      !Array.isArray(roles) ||
      !roles.every((r) => Object.values(Role).includes(r))
    ) {
      return res.status(400).json({
        message: "Invalid roles provided",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { roles } },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("ChangeUserRole Error:", err);
    res.status(500).json({
      message: "Failed to update user role",
    });
  }
};

export const changeUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("status");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newStatus = user.status === Status.ACTIVE ? Status.DEACTIVE : Status.ACTIVE;
    user.status = newStatus;
    await user.save();

    res.status(200).json({
      message: `User status changed to ${newStatus} successfully`,
      data: user,
    });
  } catch (err) {
    console.error("ChangeUserStatus Error:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

export const roleUpdateToPlayer = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { roles: [Role.PLAYER] } }, 
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const newAccessToken = signAccessToken(updatedUser);

    res.status(200).json({
      message: "User role updated to PLAYER successfully",
      data: {
        user: updatedUser,
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    console.error("RoleUpdateToPlayer Error:", err);
    res.status(500).json({ message: "Failed to update user role" });
  }
};

export const getAllPlayersProfiles = async (req: Request, res: Response) => {
  try {
    const players = await User.aggregate([
      // 1. Player Role එක තියෙන අය පමණක් තෝරන්න
      { $match: { roles: Role.PLAYER } },
      
      // 2. PlayerDetails collection එක සමඟ Join කරන්න
      {
        $lookup: {
          from: "playerdetails", // MongoDB collection name (බොහෝ විට lowercase ප්ලූරල් වේ)
          localField: "_id",
          foreignField: "userId",
          as: "profileInfo"
        }
      },

      // 3. ලැබෙන Array එක Object එකක් බවට පත් කරන්න
      { $unwind: { path: "$profileInfo", preserveNullAndEmptyArrays: true } },

      // 4. අවශ්‍ය දත්ත පමණක් තෝරාගන්න (Password ඉවත් කරන්න)
      {
        $project: {
          password: 0,
          "profileInfo.userId": 0,
          "profileInfo.createdAt": 0,
          "profileInfo.updatedAt": 0,
          "profileInfo.__v": 0
        }
      },

      { $sample: { size: 10 } }
    ]);

    res.status(200).json({
      message: "Player profiles retrieved successfully",
      data: players,
    });
  } catch (err) {
    console.error("GetAllPlayersProfiles Error:", err);
    res.status(500).json({ message: "Failed to retrieve player profiles" });
  }
};

export const getPlayerProfileById = async (req: Request, res: Response) => {
  try {
      const { id } = req.params;

      const player = await User.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(id) } },
          {
              $lookup: {
                  from: "playerdetails",
                  localField: "_id",
                  foreignField: "userId",
                  as: "profileInfo"
              }
          },
          { $unwind: { path: "$profileInfo", preserveNullAndEmptyArrays: true } },
          { $project: { password: 0 } }
      ]);

      if (!player || player.length === 0) {
          return res.status(404).json({ message: "Player not found" });
      }

      res.status(200).json({ data: player[0] });
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUsersFullnamesWithId = async (req: Request, res: Response) => {
  try {
      const users = await User.find({})
          .select("fullname _id")
          .sort({ fullname: 1 });

      res.status(200).json({
          message: "User fullnames with IDs retrieved successfully",
          data: users
      });
  } catch (err) {
      console.error("GetUsersFullnamesWithId Error:", err);
      res.status(500).json({ message: "Internal server error" });
  }
};