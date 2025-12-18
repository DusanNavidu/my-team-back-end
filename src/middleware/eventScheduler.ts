import cron from 'node-cron';
import { Event, EventStatus } from '../models/event.modal';
import moment from 'moment';

const updatePastEvents = async () => {
    const today = moment().startOf('day');

    try {
        console.log(`[CRON] Starting job: Checking for events older than ${today.format('YYYY-MM-DD')}`);

        const eventsToUpdate = await Event.find({
            EventStatus: EventStatus.UPCOMING,
            eventDate: { $lt: today.toDate() }, 
        });

        if (eventsToUpdate.length === 0) {
            console.log('[CRON] No UPCOMING events found to mark as PAST.');
            return;
        }

        const eventIds = eventsToUpdate.map(e => e._id);

        const updateResult = await Event.updateMany(
            { _id: { $in: eventIds } },
            { $set: { EventStatus: EventStatus.PAST } }
        );

        console.log(`[CRON] Successfully updated ${updateResult.modifiedCount} events to PAST status.`);
        
    } catch (error) {
        console.error('[CRON Error] Failed to update event statuses:', error);
    }
};

export const startEventScheduler = () => {
    cron.schedule('0 0 * * *', () => {
        updatePastEvents();
    }, {
        timezone: "Asia/Colombo"
    });

    console.log('[CRON] Event Status Scheduler started (Runs daily at 00:00).');
    
    updatePastEvents(); 
};