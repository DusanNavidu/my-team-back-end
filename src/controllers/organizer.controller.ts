import { Request, Response } from "express";
import { AUthRequest } from "../middleware/auth";
import cloudinary from "../config/cloudinary";
import { Organizer } from "../models/organizer.model";

export const createOrganizer = async (req: AUthRequest, res: Response) => {
  try {
    const { committeeName, contact_no, eventPlace } = req.body;

    let committeeLogoImageURL = "";
    let committeeBannerImageURL = "";

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    // Upload Logo
    if (files?.committeeLogoImage?.[0]) {
      const logoFile = files.committeeLogoImage[0];

      const logoUpload: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "organizer_logos" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(logoFile.buffer);
      });

      committeeLogoImageURL = logoUpload.secure_url;
    }

    // Upload Banner
    if (files?.committeeBannerImage?.[0]) {
      const bannerFile = files.committeeBannerImage[0];

      const bannerUpload: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "organizer_banners" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(bannerFile.buffer);
      });

      committeeBannerImageURL = bannerUpload.secure_url;
    }

    const newOrganizer = new Organizer({
      userId: req.user.sub,
      committeeName,
      contact_no,
      eventPlace,
      committeeLogoImageURL,
      committeeBannerImageURL,
    });

    await newOrganizer.save();

    res.status(201).json({
      message: "Organizer profile created successfully",
      data: newOrganizer,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create organizer profile",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
