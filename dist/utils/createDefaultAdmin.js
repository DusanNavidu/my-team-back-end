"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../models/user.model");
const user_model_2 = require("../models/user.model");
const createDefaultAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminFullname = process.env.ADMIN_FULLNAME;
        if (!adminEmail || !adminPassword || !adminFullname) {
            console.warn("Admin env variables not set");
            return;
        }
        const existingAdmin = await user_model_1.User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Default admin already exists");
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        await user_model_1.User.create({
            fullname: adminFullname,
            email: adminEmail,
            password: hashedPassword,
            roles: [user_model_2.Role.ADMIN],
            approved: user_model_2.Status.ACTIVE
        });
        console.log("Default admin user created successfully");
    }
    catch (error) {
        console.error("Error creating default admin:", error);
    }
};
exports.createDefaultAdmin = createDefaultAdmin;
