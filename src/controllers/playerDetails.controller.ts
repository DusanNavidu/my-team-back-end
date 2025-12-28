import { Response } from "express";
import { PlayerDetails } from "../models/playerDetails.modal";
import cloudinary from "../config/cloudinary";

export const updatePlayerProfile = async (req: any, res: Response) => {
  try {
    const { contactNumber, playerAbout, playerTagsSports } = req.body;
    const userId = req.user.sub; // Auth middleware eken ena ID

    // Parana profile eka check karanna (Images thiyaganna ona nisa)
    const existingProfile = await PlayerDetails.findOne({ userId });

    let playerLogoImageFileURL = existingProfile?.playerLogoImageFileURL || "";
    let playerBannerImageFileURL = existingProfile?.playerBannerImageFileURL || "";

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Logo Upload
    if (files?.playerLogoImage?.[0]) {
      const logoUpload: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "player_logos" }, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
        stream.end(files.playerLogoImage[0].buffer);
      });
      playerLogoImageFileURL = logoUpload.secure_url;
    }

    // Banner Upload
    if (files?.playerBannerImage?.[0]) {
      const bannerUpload: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "player_banners" }, (err, res) => {
          if (err) return reject(err);
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

    const updatedProfile = await PlayerDetails.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const getPlayerProfile = async (req: any, res: Response) => {
  try {
    const profile = await PlayerDetails.findOne({ userId: req.user.sub });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};