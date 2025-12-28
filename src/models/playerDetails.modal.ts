import mongoose, { Schema, Document } from "mongoose";

export interface IPLAYERDETAILS extends Document {
  userId: mongoose.Types.ObjectId;
  contactNumber: string;
  playerAbout: string;
  playerTagsSports: string[];
  playerLogoImageFileURL?: string;
  playerBannerImageFileURL?: string;
}

const PlayerDetailsSchema = new Schema<IPLAYERDETAILS>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    contactNumber: { type: String, required: true },
    playerAbout: { type: String, required: true },
    playerTagsSports: { type: [String], default: [] },
    playerLogoImageFileURL: { type: String, default: "" },
    playerBannerImageFileURL: { type: String, default: "" },
  },
  { timestamps: true }
);

export const PlayerDetails = mongoose.model<IPLAYERDETAILS>("PlayerDetails", PlayerDetailsSchema);