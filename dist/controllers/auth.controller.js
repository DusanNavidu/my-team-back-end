"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersFullnamesWithId = exports.getPlayerProfileById = exports.getAllPlayersProfiles = exports.roleUpdateToPlayer = exports.changeUserStatus = exports.changeUserRole = exports.updateUser = exports.getAllDeactiveUsersCount = exports.getAllActiveUsersCount = exports.getAllUsersByRoleCount = exports.getAllPlayersCount = exports.getAllOrganizersCount = exports.getAllUsersCount = exports.searchUsers = exports.getAllDeactiveUsers = exports.getAllactiveUsers = exports.getAllUsersByRole = exports.getAllPlayers = exports.getAllOrganizers = exports.getAllUsers = exports.getRole = exports.roleUpdate = exports.getMyProfile = exports.registerAdmin = exports.refreshToken = exports.login = exports.registerUser = void 0;
const user_model_1 = require("../models/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokens_1 = require("../utils/tokens");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email exists" });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            fullname,
            email,
            password: hash,
            roles: [user_model_1.Role.USER],
        });
        res.status(201).json({
            message: "User registed",
            data: { email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal; server error",
        });
    }
};
exports.registerUser = registerUser;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = (await user_model_1.User.findOne({ email }));
        if (!existingUser) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const valid = await bcryptjs_1.default.compare(password, existingUser.password);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (existingUser.status !== user_model_1.Status.ACTIVE) {
            return res.status(403).json({ message: "User is not active" });
        }
        const accessToken = (0, tokens_1.signAccessToken)(existingUser);
        const refreshToken = (0, tokens_1.signRefreshToken)(existingUser);
        res.status(200).json({
            message: "success",
            data: {
                email: existingUser.email,
                roles: existingUser.roles,
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal; server error",
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token required" });
        }
        const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const user = await user_model_1.User.findById(payload.sub);
        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const accessToken = (0, tokens_1.signAccessToken)(user);
        res.status(200).json({
            accessToken,
        });
    }
    catch (err) {
        res.status(403).json({ message: "Invalid or expire token" });
    }
};
exports.refreshToken = refreshToken;
const registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email exists" });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            email,
            password: hash,
            roles: [user_model_1.Role.ADMIN],
        });
        res.status(201).json({
            message: "Admin registed",
            data: { email: user.email, roles: user.roles },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.registerAdmin = registerAdmin;
const getMyProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await user_model_1.User.findById(req.user.sub).select("-password");
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    const { fullname, email, roles, _id } = user;
    res
        .status(200)
        .json({ message: "ok", data: { id: _id, email, roles, fullname } });
};
exports.getMyProfile = getMyProfile;
const roleUpdate = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.user.sub;
        if (!userId) {
            console.error("RoleUpdate Error: Missing user ID in token.");
            return res
                .status(401)
                .json({ message: "Unauthorized or missing user context." });
        }
        const currentUser = await user_model_1.User.findById(userId).select("roles");
        if (currentUser) {
            console.log(`[Role Update] User ID ${userId}: Current Roles: ${currentUser.roles}`);
            console.log(`[Role Update] Requesting Role Change to: ${role}`);
        }
        if (!Object.values(user_model_1.Role).includes(role)) {
            return res.status(400).json({ message: "Invalid role provided." });
        }
        const updateQuery = { $set: { roles: [role] } };
        const updatedUser = (await user_model_1.User.findByIdAndUpdate(userId, updateQuery, {
            new: true,
            select: "-password",
        }));
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        console.log(`[Role Update] Success! New Roles in DB: ${updatedUser.roles}`);
        const newAccessToken = (0, tokens_1.signAccessToken)(updatedUser);
        res.status(200).json({
            message: `User role successfully set to ${role}`,
            data: {
                email: updatedUser.email,
                roles: updatedUser.roles,
                accessToken: newAccessToken,
            },
        });
    }
    catch (err) {
        console.error(`[Role Update] Failed for User ${req.user.sub}:`, err); // LOG
        res.status(500).json({ message: "Failed to update user role." });
    }
};
exports.roleUpdate = roleUpdate;
const getRole = async (req, res) => {
    try {
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.sub;
        const user = await user_model_1.User.findById(userId).select("roles");
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
    }
    catch (err) {
        console.error("[Get Role] Internal server error:", err);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.getRole = getRole;
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { roles: { $ne: user_model_1.Role.ADMIN } };
        const users = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
        res.status(200).json({
            message: "Users retrieved successfully",
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
};
exports.getAllUsers = getAllUsers;
const getAllOrganizers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { roles: user_model_1.Role.ORGANIZER };
        const organizers = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
        res.status(200).json({
            message: "Organizers retrieved successfully",
            data: organizers,
            pagination: {
                totalOrganizers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllOrganizers = getAllOrganizers;
const getAllPlayers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { roles: user_model_1.Role.PLAYER };
        const players = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
        res.status(200).json({
            message: "Players retrieved successfully",
            data: players,
            pagination: {
                totalPlayers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllPlayers = getAllPlayers;
const getAllUsersByRole = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { roles: user_model_1.Role.USER };
        const users = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
        res.status(200).json({
            message: "Users retrieved successfully",
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
};
exports.getAllUsersByRole = getAllUsersByRole;
const getAllactiveUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { status: user_model_1.Status.ACTIVE, roles: { $ne: user_model_1.Role.ADMIN } };
        const users = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
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
};
exports.getAllactiveUsers = getAllactiveUsers;
const getAllDeactiveUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const query = { status: user_model_1.Status.DEACTIVE, roles: { $ne: user_model_1.Role.ADMIN } };
        const users = await user_model_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(query);
        res.status(200).json({
            message: "Deactive users retrieved successfully",
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
};
exports.getAllDeactiveUsers = getAllDeactiveUsers;
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const searchQuery = {
            $and: [
                { roles: { $ne: user_model_1.Role.ADMIN } },
                {
                    $or: [
                        { fullname: { $regex: query, $options: "i" } },
                        { email: { $regex: query, $options: "i" } },
                    ],
                },
            ],
        };
        const users = await user_model_1.User.find(searchQuery)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await user_model_1.User.countDocuments(searchQuery);
        res.status(200).json({
            message: "Users retrieved successfully",
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
};
exports.searchUsers = searchUsers;
const getAllUsersCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({});
        res.status(200).json({
            message: "Total users count retrieved successfully",
            data: { totalUsers: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllUsersCount = getAllUsersCount;
const getAllOrganizersCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({ roles: user_model_1.Role.ORGANIZER });
        res.status(200).json({
            message: "Total organizers count retrieved successfully",
            data: { totalOrganizers: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllOrganizersCount = getAllOrganizersCount;
const getAllPlayersCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({ roles: user_model_1.Role.PLAYER });
        res.status(200).json({
            message: "Total players count retrieved successfully",
            data: { totalPlayers: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllPlayersCount = getAllPlayersCount;
const getAllUsersByRoleCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({ roles: user_model_1.Role.USER });
        res.status(200).json({
            message: "Total users count retrieved successfully",
            data: { totalUsersByRole: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllUsersByRoleCount = getAllUsersByRoleCount;
const getAllActiveUsersCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({ status: user_model_1.Status.ACTIVE });
        res.status(200).json({
            message: "Total active users count retrieved successfully",
            data: { totalActiveUsers: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllActiveUsersCount = getAllActiveUsersCount;
const getAllDeactiveUsersCount = async (req, res) => {
    try {
        const total = await user_model_1.User.countDocuments({ status: user_model_1.Status.DEACTIVE });
        res.status(200).json({
            message: "Total deactive users count retrieved successfully",
            data: { totalDeactiveUsers: total },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllDeactiveUsersCount = getAllDeactiveUsersCount;
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullname, email, status, roles } = req.body;
        const updateData = {};
        if (fullname !== undefined)
            updateData.fullname = fullname;
        if (email !== undefined)
            updateData.email = email;
        if (status !== undefined)
            updateData.status = status;
        if (roles !== undefined)
            updateData.roles = roles;
        const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, select: "-password" });
        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        res.status(200).json({
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (err) {
        console.error("UpdateUser Error:", err);
        res.status(500).json({
            message: "Failed to update user",
        });
    }
};
exports.updateUser = updateUser;
const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roles } = req.body; // roles: ["ADMIN"] | ["USER"] | ["PLAYER"]
        if (!roles ||
            !Array.isArray(roles) ||
            !roles.every((r) => Object.values(user_model_1.Role).includes(r))) {
            return res.status(400).json({
                message: "Invalid roles provided",
            });
        }
        const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: { roles } }, { new: true, select: "-password" });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User role updated successfully",
            data: updatedUser,
        });
    }
    catch (err) {
        console.error("ChangeUserRole Error:", err);
        res.status(500).json({
            message: "Failed to update user role",
        });
    }
};
exports.changeUserRole = changeUserRole;
const changeUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.User.findById(userId).select("status");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newStatus = user.status === user_model_1.Status.ACTIVE ? user_model_1.Status.DEACTIVE : user_model_1.Status.ACTIVE;
        user.status = newStatus;
        await user.save();
        res.status(200).json({
            message: `User status changed to ${newStatus} successfully`,
            data: user,
        });
    }
    catch (err) {
        console.error("ChangeUserStatus Error:", err);
        res.status(500).json({ message: "Failed to update user status" });
    }
};
exports.changeUserStatus = changeUserStatus;
const roleUpdateToPlayer = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: { roles: [user_model_1.Role.PLAYER] } }, { new: true, select: "-password" });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        const newAccessToken = (0, tokens_1.signAccessToken)(updatedUser);
        res.status(200).json({
            message: "User role updated to PLAYER successfully",
            data: {
                user: updatedUser,
                accessToken: newAccessToken,
            },
        });
    }
    catch (err) {
        console.error("RoleUpdateToPlayer Error:", err);
        res.status(500).json({ message: "Failed to update user role" });
    }
};
exports.roleUpdateToPlayer = roleUpdateToPlayer;
const getAllPlayersProfiles = async (req, res) => {
    try {
        const players = await user_model_1.User.aggregate([
            // 1. Player Role එක තියෙන අය පමණක් තෝරන්න
            { $match: { roles: user_model_1.Role.PLAYER } },
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
    }
    catch (err) {
        console.error("GetAllPlayersProfiles Error:", err);
        res.status(500).json({ message: "Failed to retrieve player profiles" });
    }
};
exports.getAllPlayersProfiles = getAllPlayersProfiles;
const getPlayerProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await user_model_1.User.aggregate([
            { $match: { _id: new mongoose_1.default.Types.ObjectId(id) } },
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
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getPlayerProfileById = getPlayerProfileById;
const getUsersFullnamesWithId = async (req, res) => {
    try {
        const users = await user_model_1.User.find({})
            .select("fullname _id")
            .sort({ fullname: 1 });
        res.status(200).json({
            message: "User fullnames with IDs retrieved successfully",
            data: users
        });
    }
    catch (err) {
        console.error("GetUsersFullnamesWithId Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getUsersFullnamesWithId = getUsersFullnamesWithId;
