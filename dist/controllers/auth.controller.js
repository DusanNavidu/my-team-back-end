"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = exports.registerAdmin = exports.refreshToken = exports.login = exports.registerUser = void 0;
const user_model_1 = require("../models/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokens_1 = require("../utils/tokens");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const registerUser = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        // left email form model, right side data varible
        //   User.findOne({ email: email })
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email exists" });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        //   new User()
        const user = await user_model_1.User.create({
            firstname,
            lastname,
            email,
            password: hash,
            roles: [user_model_1.Role.USER]
        });
        res.status(201).json({
            message: "User registed",
            data: { email: user.email, roles: user.roles }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal; server error"
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
        const accessToken = (0, tokens_1.signAccessToken)(existingUser);
        const refreshToken = (0, tokens_1.signRefreshToken)(existingUser);
        res.status(200).json({
            message: "success",
            data: {
                email: existingUser.email,
                roles: existingUser.roles,
                accessToken,
                refreshToken
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal; server error"
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }
        // verify refresh token
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRECT);
        const userId = payload.sub;
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const newAccessToken = (0, tokens_1.signAccessToken)(user);
        //send new access token
        res.status(200).json({
            message: "success",
            data: {
                accessToken: newAccessToken
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Invalid refresh token or Expired"
        });
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
            roles: [user_model_1.Role.ADMIN]
        });
        res.status(201).json({
            message: "Admin registed",
            data: { email: user.email, roles: user.roles }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal server error"
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
            message: "User not found"
        });
    }
    const { email, roles, _id } = user;
    res.status(200).json({ message: "ok", data: { id: _id, email, roles } });
};
exports.getMyProfile = getMyProfile;
