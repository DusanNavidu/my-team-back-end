"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPost = exports.getAllPost = exports.createPost = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const post_model_1 = require("../models/post.model");
const createPost = async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        let imageURL = "";
        if (req.file) {
            const result = await new Promise((resole, reject) => {
                const upload_stream = cloudinary_1.default.uploader.upload_stream({ folder: "posts" }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resole(result); // success return
                });
                upload_stream.end(req.file?.buffer);
            });
            imageURL = result.secure_url;
        }
        // "one,two,tree"
        const newPost = new post_model_1.Post({
            title,
            content,
            tags: tags.split(","),
            imageURL,
            author: req.user.sub // from auth middleware
        });
        await newPost.save();
        res.status(201).json({
            message: "Post created",
            data: newPost
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Fail to create post" });
    }
    //   req.user
    //   //  {
    //   //   sub: user._id.toString(),
    //   //   roles: user.roles
    //   // }
    //   req.user.sub
    //   req.user.roles
    //   req.user.sub // userId
};
exports.createPost = createPost;
// http://localhost:5000/api/v1/post?page=1&limit=10
const getAllPost = async (req, res) => {
    try {
        // pagination
        const page = parseInt(req.query.page) | 1;
        const limit = parseInt(req.query.limit) | 10;
        const skip = (page - 1) * limit;
        const posts = await post_model_1.Post.find()
            .populate("author", "firstname email") // related model data
            .sort({ createdAt: -1 }) // change order
            .skip(skip) // ignore data for pagination
            .limit(limit); // data cound currently need
        const total = await post_model_1.Post.countDocuments();
        res.status(200).json({
            message: "Posts data",
            data: posts,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            page
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
};
exports.getAllPost = getAllPost;
// Last Task for go home
// http://localhost:5000/api/v1/post/me?page=1&limit=5
const getMyPost = async (req, res) => {
    try {
        const page = parseInt(req.query.page) | 1;
        const limit = parseInt(req.query.limit) | 10;
        const skip = (page - 1) * limit;
        const posts = await post_model_1.Post.find({ author: req.user.sub })
            .sort({ createdAt: -1 }) // change order
            .skip(skip) // ignore data for pagination
            .limit(limit); // data cound currently need
        const total = await post_model_1.Post.countDocuments({ author: req.user.sub });
        res.status(200).json({
            message: "Posts data",
            data: posts,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            page
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
};
exports.getMyPost = getMyPost;
