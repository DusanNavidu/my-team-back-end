"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerDetailsVisitor = exports.updateOrganizer = exports.getMyOrganizerDetails = exports.createOrganizer = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const organizer_model_1 = require("../models/organizer.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const createOrganizer = async (req, res) => {
    try {
        const userId = req.user.sub;
        const freshUser = await user_model_1.User.findById(userId).select('roles');
        if (!freshUser || !freshUser.roles.includes(user_model_1.Role.ORGANIZER)) {
            console.error("Authorization Error: User does not have ORGANIZER role after update."); // LOG
            return res.status(403).json({
                message: "Registration Failed",
                error: "Require ORGANIZER role (DB lag detected)"
            });
        }
        console.log(`[Authorization] Refetched User Roles: ${freshUser.roles}. Proceeding...`);
        const { committeeName, contact_no, eventPlace } = req.body;
        console.log("Received data:", { committeeName, contact_no, eventPlace });
        let committeeLogoImageURL = "";
        let committeeBannerImageURL = "";
        const files = req.files;
        console.log("Received files (Multer):", Object.keys(files || {}));
        if (files?.committeeLogoImage?.[0]) {
            const logoFile = files.committeeLogoImage[0];
            console.log("Uploading logo to Cloudinary...");
            const logoUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "organizer_logos" }, (error, result) => {
                    if (error) {
                        console.error("Cloudinary Logo Upload Error:", error);
                        return reject(error);
                    }
                    resolve(result);
                });
                stream.end(logoFile.buffer);
            });
            committeeLogoImageURL = logoUpload.secure_url;
        }
        if (files?.committeeBannerImage?.[0]) {
            const bannerFile = files.committeeBannerImage[0];
            console.log("Uploading banner to Cloudinary...");
            const bannerUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "organizer_banners" }, (error, result) => {
                    if (error) {
                        console.error("Cloudinary Banner Upload Error:", error);
                        return reject(error);
                    }
                    resolve(result);
                });
                stream.end(bannerFile.buffer);
            });
            committeeBannerImageURL = bannerUpload.secure_url;
        }
        console.log("Final URLs before DB Save:", { committeeLogoImageURL, committeeBannerImageURL });
        const newOrganizer = new organizer_model_1.Organizer({
            userId: req.user.sub,
            committeeName,
            contact_no,
            eventPlace,
            committeeLogoImageURL,
            committeeBannerImageURL,
        });
        await newOrganizer.save();
        console.log("Organizer saved to DB successfully.");
        res.status(201).json({
            message: "Organizer profile created successfully",
            data: newOrganizer,
        });
    }
    catch (err) {
        console.error("Organizer Creation Catch Error (General):", err);
        res.status(500).json({
            message: "Failed to create organizer profile",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};
exports.createOrganizer = createOrganizer;
const getMyOrganizerDetails = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!req.user.roles.includes(user_model_1.Role.ORGANIZER)) {
            return res.status(403).json({ message: "Access Denied. User is not registered as an Organizer." });
        }
        const organizer = await organizer_model_1.Organizer.findOne({ userId });
        if (!organizer) {
            console.warn(`Organizer profile not found for user ID: ${userId}`); // LOG
            return res.status(404).json({ message: "Organizer profile not yet created." });
        }
        res.status(200).json({
            message: "Organizer details retrieved successfully",
            data: organizer,
        });
    }
    catch (err) {
        console.error("Error fetching organizer profile:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getMyOrganizerDetails = getMyOrganizerDetails;
const updateOrganizer = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { committeeName, contact_no, eventPlace } = req.body;
        const existingOrganizer = await organizer_model_1.Organizer.findOne({ userId });
        if (!existingOrganizer) {
            return res.status(404).json({ message: "Organizer profile not found. Please register first." });
        }
        let updateFields = {};
        if (committeeName)
            updateFields.committeeName = committeeName;
        if (contact_no)
            updateFields.contact_no = contact_no;
        if (eventPlace)
            updateFields.eventPlace = eventPlace;
        const files = req.files;
        if (files?.committeeLogoImage?.[0]) {
            const logoFile = files.committeeLogoImage[0];
            const logoUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "organizer_logos" }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
                stream.end(logoFile.buffer);
            });
            updateFields.committeeLogoImageURL = logoUpload.secure_url;
            console.log("New Logo uploaded:", updateFields.committeeLogoImageURL);
        }
        if (files?.committeeBannerImage?.[0]) {
            const bannerFile = files.committeeBannerImage[0];
            const bannerUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "organizer_banners" }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
                stream.end(bannerFile.buffer);
            });
            updateFields.committeeBannerImageURL = bannerUpload.secure_url;
            console.log("New Banner uploaded:", updateFields.committeeBannerImageURL);
        }
        const updatedOrganizer = await organizer_model_1.Organizer.findOneAndUpdate({ userId: userId }, { $set: updateFields }, { new: true, runValidators: true });
        res.status(200).json({
            message: "Organizer profile updated successfully",
            data: updatedOrganizer,
        });
    }
    catch (err) {
        console.error("Organizer Update Catch Error:", err);
        res.status(500).json({
            message: "Failed to update organizer profile",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};
exports.updateOrganizer = updateOrganizer;
const getOrganizerDetailsVisitor = async (req, res) => {
    try {
        const { organizerId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(organizerId)) {
            return res.status(400).json({ message: "Invalid Organizer ID format" });
        }
        const organizer = await organizer_model_1.Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ message: "Organizer profile not found" });
        }
        res.status(200).json({
            message: "Organizer details retrieved successfully",
            data: organizer,
        });
    }
    catch (err) {
        console.error("Error fetching organizer profile:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getOrganizerDetailsVisitor = getOrganizerDetailsVisitor;
