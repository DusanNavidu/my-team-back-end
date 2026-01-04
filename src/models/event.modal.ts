import mongoose, { Document, Schema } from "mongoose";

export enum EventStatus {
    UPCOMING = "UPCOMING",
    PAST = "PAST",
    BANNED = "BANNED",
    CANCELLED = "CANCELLED",
}

export interface IEVENT extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    eventName: string;
    eventDescription: string;
    category: string;
    eventDate: Date;
    eventStartingTime: string;
    eventCity: string;
    eventLocation: string;
    eventImageURL: string;
    EventStatus: EventStatus;
    likes: mongoose.Types.ObjectId[];
    comments: mongoose.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}

const EventSchema = new Schema<IEVENT>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        eventName: { type: String, required: true },
        eventDescription: { type: String, required: true },
        category: { type: String, required: true },
        eventDate: { type: Date, required: true },
        eventStartingTime: { type: String, required: true },
        eventCity: { type: String, required: true },
        eventLocation: { type: String, required: true },
        eventImageURL: { type: String },
        EventStatus: { type: String, enum: Object.values(EventStatus), default: EventStatus.UPCOMING },
        likes: [{ type: mongoose.Types.ObjectId, ref: "User", default: [] }],
        comments: [{ type: mongoose.Types.ObjectId, ref: "Comment", default: [] }],
    },
    { timestamps: true }
);

export const Event = mongoose.model<IEVENT>("Event", EventSchema);