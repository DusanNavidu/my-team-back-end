"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerProfile = exports.updatePlayerProfile = void 0;
const playerDetails_modal_1 = require("../models/playerDetails.modal");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const updatePlayerProfile = async (req, res) => {
    try {
        const { contactNumber, playerAbout, playerTagsSports } = req.body;
        const userId = req.user.sub; // Auth middleware eken ena ID
        // Parana profile eka check karanna (Images thiyaganna ona nisa)
        const existingProfile = await playerDetails_modal_1.PlayerDetails.findOne({ userId });
        let playerLogoImageFileURL = existingProfile?.playerLogoImageFileURL || "";
        let playerBannerImageFileURL = existingProfile?.playerBannerImageFileURL || "";
        const files = req.files;
        // Logo Upload
        if (files?.playerLogoImage?.[0]) {
            const logoUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "player_logos" }, (err, res) => {
                    if (err)
                        return reject(err);
                    resolve(res);
                });
                stream.end(files.playerLogoImage[0].buffer);
            });
            playerLogoImageFileURL = logoUpload.secure_url;
        }
        // Banner Upload
        if (files?.playerBannerImage?.[0]) {
            const bannerUpload = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "player_banners" }, (err, res) => {
                    if (err)
                        return reject(err);
                    resolve(res);
                });
                stream.end(files.playerBannerImage[0].buffer);
            });
            playerBannerImageFileURL = bannerUpload.secure_url;
        }
        const updateData = {
            contactNumber,
            playerAbout,
            playerTagsSports: playerTagsSports ? JSON.parse(playerTagsSports) : [],
            playerLogoImageFileURL,
            playerBannerImageFileURL,
        };
        const updatedProfile = await playerDetails_modal_1.PlayerDetails.findOneAndUpdate({ userId }, { $set: updateData }, { new: true, upsert: true, runValidators: true });
        res.status(200).json(updatedProfile);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
exports.updatePlayerProfile = updatePlayerProfile;
const getPlayerProfile = async (req, res) => {
    try {
        const profile = await playerDetails_modal_1.PlayerDetails.findOne({ userId: req.user.sub });
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
    }
};
exports.getPlayerProfile = getPlayerProfile;
