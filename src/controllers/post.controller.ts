import { Response } from "express";
import Post from "../models/post.modal";
import cloudinary from "../config/cloudinary";
import { Role } from "../models/user.model";

export const createPost = async (req: any, res: Response) => {
    try {
        const { title, mention, feeling, description, tagInput, status } = req.body;
        const userId = req.user.sub; // From auth middleware

        let playerPostImageFileURL = "";

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files?.postImage?.[0]) {
            const file = files.postImage[0];
            const uploadRes: any = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "player_posts" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(file.buffer);
            });
            playerPostImageFileURL = uploadRes.secure_url;
        }

        const newPost = new Post({
            userId,
            title,
            description,
            feeling,
            playerPostImageFileURL,
            mention: mention ? mention.split(",").map((m: string) => m.trim()) : [],
            tagInput: tagInput ? tagInput.split(",").map((t: string) => t.trim()) : [],
            status: status || "public"
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error("Post Creation Error:", error);
        res.status(500).json({ message: "Error creating post" });
    }
};

export const getMePosts = async (req: any, res: Response) => {
    try {
        const userId = req.user.sub;
        const posts = await Post.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ data: posts, message: "Posts retrieved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};