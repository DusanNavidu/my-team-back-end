import mongoose, { Schema, Document } from "mongoose";

enum PostStatus {
    PRIVATE = "private",
    PUBLIC = "public",
    UNLISTED = "unlisted",
    BANNED = "banned"
}

enum PostType {
    IMAGE = "image",
    VIDEO = "video",
    TEXT = "text"
}

enum postingType {
    Story = "story",
    Post = "post",
    Both = "both"
}

export interface IPOST extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    playerPostImageFileURL: string;
    title?: string;
    mention?: string[];
    feeling?: string;
    description?: string;
    tagInput?: string[];
    userRole?: string;
    postingType?: postingType;
    status: PostStatus;
    likes: mongoose.Types.ObjectId[];
    comments: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema: Schema = new Schema(
    {
        userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
        playerPostImageFileURL: { type: String, required: true },
        title: { type: String, default: "" },
        mention: { type: [String], default: [] },
        feeling: { type: String, default: "" },
        description: { type: String, default: "" },
        tagInput: { type: [String], default: [] },
        userRole: { type: String, default: "" },
        postingType: {
            type: String,
            enum: Object.values(postingType),
            default: postingType.Post
        },
        status: { 
            type: String, 
            enum: Object.values(PostStatus), 
            default: PostStatus.PUBLIC 
        },
        likes: [{ type: mongoose.Types.ObjectId, ref: "User", default: [] }],
        comments: [{ type: mongoose.Types.ObjectId, ref: "Comment", default: [] }],
    },
    { timestamps: true }
);

export default mongoose.model<IPOST>("Post", PostSchema);