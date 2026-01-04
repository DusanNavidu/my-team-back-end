import { Response, Request } from "express";
import { Application } from "../models/application.model";
import { Event } from "../models/event.modal";

export const applyForEvent = async (req: any, res: Response) => {
    try {
        const { eventId } = req.params;
        const playerId = req.user.sub;

        const existingApp = await Application.findOne({ eventId, playerId });
        if (existingApp) {
            return res.status(400).json({ message: "You have already applied for this event." });
        }

        const newApplication = new Application({ eventId, playerId });
        await newApplication.save();

        res.status(201).json({ message: "Applied successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during application." });
    }
};

export const checkAppliedStatus = async (req: any, res: Response) => {
    try {
        const { eventId } = req.params;
        const playerId = req.user.sub;
        const applied = await Application.exists({ eventId, playerId });
        res.status(200).json({ applied: !!applied });
    } catch (error) {
        res.status(500).json({ message: "Error checking status." });
    }
};

// getAll Applications for an Organizer's Events
export const getOrganizerApplications = async (req: any, res: Response) => {
    try {
        const organizerId = req.user.sub;

        const myEvents = await Event.find({ userId: organizerId }).select("_id");
        const eventIds = myEvents.map(ev => ev._id);

        const applications = await Application.find({ eventId: { $in: eventIds } })
            .populate({
                path: "eventId",
                select: "eventName eventImageURL eventDate category"
            })
            .populate({
                path: "playerId",
                select: "fullname email",
                populate: { path: "playerProfile", select: "playerLogoImageFileURL" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            message: "Applications synced successfully", 
            data: applications 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedApp = await Application.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.status(200).json({ message: `Application ${status.toLowerCase()}`, data: updatedApp });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};