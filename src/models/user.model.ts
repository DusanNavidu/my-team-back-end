import mongoose, { Document, Schema } from "mongoose"

export enum Role {
  ADMIN = "ADMIN",
  PLAYER = "PLAYER",
  ORGANIZER = "ORGANIZER",
  USER = "USER"
}

export enum Status {
  ACTIVE = "ACTIVE",
  DEACTIVE = "DEACTIVE",
}

export interface IUSER extends Document {
  _id: mongoose.Types.ObjectId
  fullname: string
  email: string
  password: string
  roles: Role[]
  status: Status
  createdAt?: Date
  updatedAt?: Date
}

const userSchema = new Schema<IUSER>(
  {
    email: { type: String, unique: true, lowercase: true, required: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.ACTIVE
    }
  },
  { timestamps: true }
)

export const User = mongoose.model<IUSER>("User", userSchema)
