import { Request, Response } from "express";
import { AUthRequest } from "../middleware/auth";
import cloudinary from "../config/cloudinary";
import { Event, EventStatus } from "../models/event.modal";
import { Types } from "mongoose";
import { Organizer } from "../models/organizer.model";

export const createEvent = async (req: AUthRequest, res: Response) => {
    try {
        const { eventName, eventDescription, category, eventDate, eventStartingTime, eventCity, eventLocation } = req.body;
        console.log("Received data:", { eventName, eventDescription, category, eventDate, eventStartingTime, eventCity, eventLocation });

        let eventImageURL = "";

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        console.log("Received files (Multer):", Object.keys(files || {}));

        if (!files?.eventImage?.[0]) {
            return res.status(400).json({ message: "Event image file is required." });
        }

        const eventImageFile = files.eventImage[0];
        console.log("Uploading event image to Cloudinary...");

        const eventImageUpload: any = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "event_images" },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary Event Image Upload Error:", error);
                        return reject(error);
                    }
                    resolve(result);
                }
            );
            stream.end(eventImageFile.buffer);
        });

        eventImageURL = eventImageUpload.secure_url;
        console.log("Event image uploaded to Cloudinary:", eventImageURL);
        
        const userId = req.user.sub;
        
        const newEvent = new Event({
            userId: userId,
            eventName,
            eventDescription,
            category,
            eventDate,
            eventStartingTime,
            eventCity,
            eventLocation,
            eventImageURL,
            EventStatus: EventStatus.UPCOMING,
        });

        await newEvent.save();

        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : error });
    }
};

export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const validStatuses = [EventStatus.UPCOMING, EventStatus.PAST, EventStatus.CANCELLED];

        const events = await Event.find({ EventStatus: { $in: validStatuses } })
            .populate({
                path: "userId",
                select: "fullname email", // User ගේ මූලික විස්තර
                populate: {
                    path: "organizerProfile", // User හරහා Organizer Profile එකට යයි
                    model: "Organizer",
                    select: "committeeName contact_no eventPlace committeeLogoImageURL committeeBannerImageURL status" 
                }
            })
            .sort({ eventDate: 1, eventStartingTime: 1 });

        res.status(200).json({ 
            message: "Events retrieved successfully", 
            events 
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getOrganizerEvents = async (req: AUthRequest, res: Response) => {
    try {
        const userId = req.user.sub;
        
        const validStatuses = [
            EventStatus.UPCOMING,
            EventStatus.PAST,
            EventStatus.CANCELLED,
            EventStatus.BANNED
        ];

        const events = await Event.find({ 
            userId: new Types.ObjectId(userId), 
            EventStatus: { $in: validStatuses },
            createdAt: { $exists: true }
        }).sort({ eventDate: -1, eventStartingTime: -1 });

        res.status(200).json({ 
            message: "Organizer events retrieved successfully", 
            events 
        });

    } catch (error) {
        console.error("Error fetching organizer events:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : error });
    }
};

export const getEventsByOrganizerId = async (req: Request, res: Response) => {
    try {
        const { organizerId } = req.params; // මෙතැනට එන්නේ Organizer Model එකේ _id එක

        // 1. මුලින්ම Organizer ව සොයා ඔහුගේ userId (User model reference) ලබාගන්න
        const organizerRecord = await Organizer.findById(organizerId);
        
        if (!organizerRecord) {
            return res.status(404).json({ message: "Organizer not found" });
        }

        // 2. එම userId එකට අදාළ events සොයාගෙන, User සහ OrganizerProfile populate කරන්න
        const events = await Event.find({ userId: organizerRecord.userId })
            .populate({
                path: "userId",
                select: "fullname email",
                populate: {
                    path: "organizerProfile",
                    model: "Organizer"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            message: "Organizer events retrieved successfully", 
            events 
        });
    } catch (error) {
        console.error("Error fetching organizer events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};