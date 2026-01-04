import mongoose, { Document, Schema } from "mongoose";

export interface IAPPLICATION extends Document {
    eventId: mongoose.Types.ObjectId;
    playerId: mongoose.Types.ObjectId;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
}

const ApplicationSchema = new Schema<IAPPLICATION>(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
        playerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
    },
    { timestamps: true }
);

// එකම Player හට එකම Event එකට දෙපාරක් apply කළ නොහැකි වන සේ Index එකක් යොදමු
ApplicationSchema.index({ eventId: 1, playerId: 1 }, { unique: true });

export const Application = mongoose.model<IAPPLICATION>("Application", ApplicationSchema);