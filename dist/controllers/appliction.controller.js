"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getOrganizerApplications = exports.checkAppliedStatus = exports.applyForEvent = void 0;
const application_model_1 = require("../models/application.model");
const event_modal_1 = require("../models/event.modal");
const applyForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const playerId = req.user.sub;
        const existingApp = await application_model_1.Application.findOne({ eventId, playerId });
        if (existingApp) {
            return res.status(400).json({ message: "You have already applied for this event." });
        }
        const newApplication = new application_model_1.Application({ eventId, playerId });
        await newApplication.save();
        res.status(201).json({ message: "Applied successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error during application." });
    }
};
exports.applyForEvent = applyForEvent;
const checkAppliedStatus = async (req, res) => {
    try {
        const { eventId } = req.params;
        const playerId = req.user.sub;
        const applied = await application_model_1.Application.exists({ eventId, playerId });
        res.status(200).json({ applied: !!applied });
    }
    catch (error) {
        res.status(500).json({ message: "Error checking status." });
    }
};
exports.checkAppliedStatus = checkAppliedStatus;
// getAll Applications for an Organizer's Events
const getOrganizerApplications = async (req, res) => {
    try {
        const organizerId = req.user.sub;
        const myEvents = await event_modal_1.Event.find({ userId: organizerId }).select("_id");
        const eventIds = myEvents.map(ev => ev._id);
        const applications = await application_model_1.Application.find({ eventId: { $in: eventIds } })
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
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getOrganizerApplications = getOrganizerApplications;
// 2. Application Status එක වෙනස් කිරීම (Accept/Reject)
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // PENDING, ACCEPTED, REJECTED
        const updatedApp = await application_model_1.Application.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json({ message: `Application ${status.toLowerCase()}`, data: updatedApp });
    }
    catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
