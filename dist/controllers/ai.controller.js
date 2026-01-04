"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = void 0;
const axios_1 = __importDefault(require("axios"));
const generateContent = async (req, res) => {
    try {
        const { text, maxToken } = req.body;
        // Call to Google Gemini API
        const aiResponse = await axios_1.default.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            contents: [
                {
                    parts: [{ text }]
                }
            ],
            generationConfig: {
                maxOutputTokens: maxToken || 150
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": "" // Replace with actual API key
            }
        });
        const genratedContent = aiResponse.data?.candidates?.[0]?.content?.[0]?.text ||
            aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No data";
        console.log(res);
        res.status(200).json({
            data: genratedContent
        });
    }
    catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({
            message: "Failed to generate content",
        });
    }
};
exports.generateContent = generateContent;
