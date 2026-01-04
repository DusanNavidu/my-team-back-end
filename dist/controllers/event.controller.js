"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventsByOrganizerId = exports.getOrganizerEvents = exports.getAllEvents = exports.createEvent = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const event_modal_1 = require("../models/event.modal");
const mongoose_1 = require("mongoose");
const organizer_model_1 = require("../models/organizer.model");
const createEvent = async (req, res) => {
    try {
        const { eventName, eventDescription, category, eventDate, eventStartingTime, eventCity, eventLocation } = req.body;
        // console.log("Received data:", { eventName, eventDescription, category, eventDate, eventStartingTime, eventCity, eventLocation });
        let eventImageURL = "";
        const files = req.files;
        console.log("Received files (Multer):", Object.keys(files || {}));
        if (!files?.eventImage?.[0]) {
            return res.status(400).json({ message: "Event image file is required." });
        }
        const eventImageFile = files.eventImage[0];
        console.log("Uploading event image to Cloudinary...");
        const eventImageUpload = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({ folder: "event_images" }, (error, result) => {
                if (error) {
                    console.error("Cloudinary Event Image Upload Error:", error);
                    return reject(error);
                }
                resolve(result);
            });
            stream.end(eventImageFile.buffer);
        });
        eventImageURL = eventImageUpload.secure_url;
        console.log("Event image uploaded to Cloudinary:", eventImageURL);
        const userId = req.user.sub;
        const newEvent = new event_modal_1.Event({
            userId: userId,
            eventName,
            eventDescription,
            category,
            eventDate,
            eventStartingTime,
            eventCity,
            eventLocation,
            eventImageURL,
            EventStatus: event_modal_1.EventStatus.UPCOMING,
        });
        await newEvent.save();
        res.status(201).json({ message: "Event created successfully", event: newEvent });
    }
    catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : error });
    }
};
exports.createEvent = createEvent;
const getAllEvents = async (req, res) => {
    try {
        const validStatuses = ["UPCOMING", "PAST", "CANCELLED"]; // EventStatus enum එකට අනුව
        const events = await event_modal_1.Event.aggregate([
            // 1. වලංගු Status ඇති Events පමණක් තෝරන්න
            { $match: { EventStatus: { $in: validStatuses } } },
            // 2. Random: අහඹු ලෙස Events 20ක් (හෝ ඔබට අවශ්‍ය ගණන) තෝරන්න
            { $sample: { size: 20 } },
            // 3. User Details Join කිරීම (Lookup)
            {
                $lookup: {
                    from: "users", // User collection නම
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId"
                }
            },
            { $unwind: "$userId" },
            // 4. Organizer Profile Join කිරීම (Nested Lookup)
            {
                $lookup: {
                    from: "organizers", // Organizer collection නම
                    localField: "userId._id",
                    foreignField: "userId",
                    as: "userId.organizerProfile"
                }
            },
            { $unwind: { path: "$userId.organizerProfile", preserveNullAndEmptyArrays: true } },
            // 5. අවශ්‍ය දත්ත පමණක් තෝරාගැනීම (Project)
            {
                $project: {
                    "userId.password": 0,
                    "userId.__v": 0,
                    "userId.organizerProfile.__v": 0
                }
            }
        ]);
        res.status(200).json({
            message: "Random events retrieved successfully",
            events
        });
    }
    catch (error) {
        console.error("Error fetching random events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getAllEvents = getAllEvents;
const getOrganizerEvents = async (req, res) => {
    try {
        const userId = req.user.sub;
        const validStatuses = [
            event_modal_1.EventStatus.UPCOMING,
            event_modal_1.EventStatus.PAST,
            event_modal_1.EventStatus.CANCELLED,
            event_modal_1.EventStatus.BANNED
        ];
        const events = await event_modal_1.Event.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            EventStatus: { $in: validStatuses },
            createdAt: { $exists: true }
        }).sort({ eventDate: -1, eventStartingTime: -1 });
        res.status(200).json({
            message: "Organizer events retrieved successfully",
            events
        });
    }
    catch (error) {
        console.error("Error fetching organizer events:", error);
        res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : error });
    }
};
exports.getOrganizerEvents = getOrganizerEvents;
const getEventsByOrganizerId = async (req, res) => {
    try {
        const { organizerId } = req.params; // මෙතැනට එන්නේ Organizer Model එකේ _id එක
        // 1. මුලින්ම Organizer ව සොයා ඔහුගේ userId (User model reference) ලබාගන්න
        const organizerRecord = await organizer_model_1.Organizer.findById(organizerId);
        if (!organizerRecord) {
            return res.status(404).json({ message: "Organizer not found" });
        }
        // 2. එම userId එකට අදාළ events සොයාගෙන, User සහ OrganizerProfile populate කරන්න
        const events = await event_modal_1.Event.find({ userId: organizerRecord.userId })
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
    }
    catch (error) {
        console.error("Error fetching organizer events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getEventsByOrganizerId = getEventsByOrganizerId;
