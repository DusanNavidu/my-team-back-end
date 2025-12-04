import mongoose, { Document, Schema } from "mongoose";

export enum Status {
    NONE = "NONE",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export interface IORGANIZER extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    committeeName: string;
    contact_no: string;
    eventPlace: string;
    committeeLogoImageURL: string;
    committeeBannerImageURL: string;
    status: Status;
    createdAt?: Date;
    updatedAt?: Date;
}

const OrganizerSchema = new Schema<IORGANIZER>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        committeeName: { type: String, required: true },
        contact_no: { type: String, required: true, unique: true },
        eventPlace: { type: String, required: true },
        committeeLogoImageURL: { type: String },
        committeeBannerImageURL: { type: String },
        status: { type: String, enum: Object.values(Status), default: Status.APPROVED },
    },
        { timestamps: true }
    );

    export const Organizer = mongoose.model<IORGANIZER>("Organizer",OrganizerSchema);