import mongoose, { Document, Schema } from "mongoose"

export enum Role {
  ADMIN = "ADMIN",
  PLAYER = "PLAYER",
  ORGANIZER = "ORGANIZER",
  USER = "USER"
}

export enum Status {
  NONE = "NONE",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface IUSER extends Document {
  _id: mongoose.Types.ObjectId
  fullname: string
  email: string
  password: string
  roles: Role[]
  approved: Status
}

const userSchema = new Schema<IUSER>({
  email: { type: String, unique: true, lowercase: true, required: true },
  fullname: { type: String, required: true },
  password: { type: String, required: true },
  roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  approved: {
    type: String,
    enum: Object.values(Status),
    default: Status.APPROVED
  }
})

export const User = mongoose.model<IUSER>("User", userSchema)
