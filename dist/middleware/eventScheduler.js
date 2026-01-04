"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEventScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const event_modal_1 = require("../models/event.modal");
const moment_1 = __importDefault(require("moment"));
const updatePastEvents = async () => {
    const today = (0, moment_1.default)().startOf('day');
    try {
        console.log(`[CRON] Starting job: Checking for events older than ${today.format('YYYY-MM-DD')}`);
        const eventsToUpdate = await event_modal_1.Event.find({
            EventStatus: event_modal_1.EventStatus.UPCOMING,
            eventDate: { $lt: today.toDate() },
        });
        if (eventsToUpdate.length === 0) {
            console.log('[CRON] No UPCOMING events found to mark as PAST.');
            return;
        }
        const eventIds = eventsToUpdate.map(e => e._id);
        const updateResult = await event_modal_1.Event.updateMany({ _id: { $in: eventIds } }, { $set: { EventStatus: event_modal_1.EventStatus.PAST } });
        console.log(`[CRON] Successfully updated ${updateResult.modifiedCount} events to PAST status.`);
    }
    catch (error) {
        console.error('[CRON Error] Failed to update event statuses:', error);
    }
};
const startEventScheduler = () => {
    node_cron_1.default.schedule('0 0 * * *', () => {
        updatePastEvents();
    }, {
        timezone: "Asia/Colombo"
    });
    console.log('[CRON] Event Status Scheduler started (Runs daily at 00:00).');
    updatePastEvents();
};
exports.startEventScheduler = startEventScheduler;
