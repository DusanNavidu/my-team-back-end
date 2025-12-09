import { Request, Response } from "express";
import { AUthRequest } from "../middleware/auth";
import cloudinary from "../config/cloudinary";
import { Organizer } from "../models/organizer.model";
import { User, Role } from "../models/user.model";

export const createOrganizer = async (req: AUthRequest, res: Response) => {
    try {
        const userId = req.user.sub;
        const freshUser = await User.findById(userId).select('roles');
        
        if (!freshUser || !freshUser.roles.includes(Role.ORGANIZER)) {
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

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        console.log("Received files (Multer):", Object.keys(files || {}));

        if (files?.committeeLogoImage?.[0]) {
            const logoFile = files.committeeLogoImage[0];
            console.log("Uploading logo to Cloudinary...");

            const logoUpload: any = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "organizer_logos" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Logo Upload Error:", error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                stream.end(logoFile.buffer);
            });

            committeeLogoImageURL = logoUpload.secure_url;
        }

        if (files?.committeeBannerImage?.[0]) {
            const bannerFile = files.committeeBannerImage[0];
            console.log("Uploading banner to Cloudinary...");

            const bannerUpload: any = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "organizer_banners" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Banner Upload Error:", error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                stream.end(bannerFile.buffer);
            });

            committeeBannerImageURL = bannerUpload.secure_url;
        }

        console.log("Final URLs before DB Save:", { committeeLogoImageURL, committeeBannerImageURL });

        const newOrganizer = new Organizer({
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

    } catch (err) {
        console.error("Organizer Creation Catch Error (General):", err);
        res.status(500).json({
            message: "Failed to create organizer profile",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};

export const getMyOrganizerDetails = async (req: AUthRequest, res: Response) => {
    try {
        const userId = req.user.sub;
        
        // 1. Organizer role එක තිබේදැයි පරීක්ෂා කිරීම (අනවශ්‍ය DB access අඩු කිරීමට)
        if (!req.user.roles.includes(Role.ORGANIZER)) {
             return res.status(403).json({ message: "Access Denied. User is not registered as an Organizer." });
        }

        // 2. Organizer Model එකෙන් userId එකට අදාළ details සොයා ගැනීම
        const organizer = await Organizer.findOne({ userId });

        if (!organizer) {
            console.warn(`Organizer profile not found for user ID: ${userId}`); // LOG
            return res.status(404).json({ message: "Organizer profile not yet created." });
        }

        res.status(200).json({
            message: "Organizer details retrieved successfully",
            data: organizer,
        });

    } catch (err) {
        console.error("Error fetching organizer profile:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};