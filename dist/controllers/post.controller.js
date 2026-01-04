"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLikePost = exports.getPlayerPostsById = exports.updatePost = exports.deletePost = exports.getAllPosts = exports.getTenLatestStories = exports.getMyStory = exports.getMePosts = exports.createPost = void 0;
const post_modal_1 = __importDefault(require("../models/post.modal"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const createPost = async (req, res) => {
    try {
        const { title, mention, feeling, description, tagInput, status, postingType } = req.body;
        const userId = req.user.sub;
        let playerPostImageFileURL = "";
        const files = req.files;
        if (files?.postImage?.[0]) {
            const uploadRes = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "player_posts" }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
                stream.end(files.postImage[0].buffer);
            });
            playerPostImageFileURL = uploadRes.secure_url;
        }
        const newPost = new post_modal_1.default({
            userId,
            title: title || "",
            description: description || "",
            feeling: feeling || "",
            playerPostImageFileURL,
            postingType: postingType || "post",
            mention: mention ? JSON.parse(mention) : [],
            tagInput: tagInput ? JSON.parse(tagInput) : [],
            status: status || "public"
        });
        await newPost.save();
        res.status(201).json(newPost);
    }
    catch (error) {
        console.error("Post Creation Error:", error);
        res.status(500).json({ message: "Error creating post" });
    }
};
exports.createPost = createPost;
const getMePosts = async (req, res) => {
    try {
        const userId = req.user.sub;
        const posts = await post_modal_1.default.find({
            userId,
            postingType: { $in: ["post", "both"] }
        }).sort({ createdAt: -1 });
        res.status(200).json({
            data: posts,
            message: "Timeline posts retrieved successfully"
        });
    }
    catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getMePosts = getMePosts;
const getMyStory = async (req, res) => {
    try {
        const userId = req.user.sub;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const stories = await post_modal_1.default.find({
            userId,
            postingType: { $in: ["story", "both"] },
            createdAt: { $gte: twentyFourHoursAgo }
        }).sort({ createdAt: -1 });
        res.status(200).json({ data: stories });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getMyStory = getMyStory;
const getTenLatestStories = async (req, res) => {
    try {
        const tenLatestStories = await post_modal_1.default.find({
            postingType: { $in: ["story", "both"] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
            .sort({ createdAt: -1 })
            .limit(10);
        res.status(200).json({ data: tenLatestStories });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getTenLatestStories = getTenLatestStories;
const getAllPosts = async (req, res) => {
    try {
        const posts = await post_modal_1.default.aggregate([
            // 1. Filter: Public සහ Timeline පෝස්ට් පමණක් තෝරන්න
            {
                $match: {
                    postingType: { $in: ["post", "both"] },
                    status: "public"
                }
            },
            // 2. Random: අහඹු ලෙස පෝස්ට් 20ක් (හෝ ඔබට අවශ්‍ය ගණනක්) තෝරන්න
            { $sample: { size: 20 } },
            // 3. Populate: User details එකතු කරන්න (Aggregate වලදී $lookup භාවිතා වේ)
            {
                $lookup: {
                    from: "users", // ඔබේ User collection එකේ නම (බොහෝවිට 'users')
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId"
                }
            },
            // 4. Unwind: ලැබෙන User array එක object එකක් බවට පත් කරන්න
            { $unwind: "$userId" },
            // 5. Project: අවශ්‍ය නැති දත්ත (Password වැනි) ඉවත් කරන්න
            {
                $project: {
                    "userId.password": 0,
                    "userId.status": 0,
                    "userId.createdAt": 0,
                    "userId.updatedAt": 0,
                    "userId.__v": 0
                }
            }
        ]);
        return res.status(200).json({
            data: posts,
            message: "Random posts retrieved successfully"
        });
    }
    catch (error) {
        console.error("GetAllPosts Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getAllPosts = getAllPosts;
// 1. Delete Post & Image from Cloudinary
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;
        const post = await post_modal_1.default.findById(id);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        if (post.userId.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });
        if (post.playerPostImageFileURL) {
            const publicId = post.playerPostImageFileURL.split('/').pop()?.split('.')[0];
            await cloudinary_1.default.uploader.destroy(`player_posts/${publicId}`);
        }
        await post_modal_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: "Post deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting post" });
    }
};
exports.deletePost = deletePost;
// 2. Update Post Details
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, feeling, tagInput } = req.body;
        const userId = req.user.sub;
        const updatedPost = await post_modal_1.default.findOneAndUpdate({ _id: id, userId: userId }, {
            title,
            description,
            feeling,
            tagInput: typeof tagInput === 'string' ? JSON.parse(tagInput) : tagInput
        }, { new: true });
        if (!updatedPost)
            return res.status(404).json({ message: "Post not found or unauthorized" });
        res.status(200).json(updatedPost);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating post" });
    }
};
exports.updatePost = updatePost;
const getPlayerPostsById = async (req, res) => {
    try {
        const { id } = req.params; // Profile එක අයිති ප්ලේයර්ගේ ID එක
        const loggedInUserId = req.user.sub; // දැනට ලොග් වී සිටින යූසර්ගේ ID එක
        // Query එක තීරණය කිරීම
        let query = {
            userId: id,
            postingType: { $in: ["post", "both"] }
        };
        // පෝස්ට් අයිතිකරු නොවන අයෙක් බලනවා නම් 'public' පෝස්ට් පමණක් පෙන්වන්න
        if (id !== loggedInUserId) {
            query.status = "public";
        }
        const posts = await post_modal_1.default.find(query)
            .populate("userId", "fullname email")
            .sort({ createdAt: -1 });
        res.status(200).json({ data: posts });
    }
    catch (error) {
        console.error("GetPlayerPosts Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getPlayerPostsById = getPlayerPostsById;
const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.sub;
        const post = await post_modal_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        const isLiked = post.likes.includes(userId);
        // Atomic operation එකක් ලෙස Update කිරීම
        const updatedPost = await post_modal_1.default.findByIdAndUpdate(postId, isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } }, { new: true } // Update වූ පසු අලුත් දත්ත ලබා ගැනීමට
        );
        res.status(200).json({
            message: isLiked ? "Unliked" : "Liked",
            isLiked: !isLiked,
            likesCount: updatedPost?.likes.length
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error toggling like" });
    }
};
exports.toggleLikePost = toggleLikePost;
