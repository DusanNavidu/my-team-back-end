import { Request, Response } from "express";
import axios from "axios";

export const generateContent = async (req: Request, res: Response) => {
  try {
    const { text, maxToken } = req.body

    // Call to Google Gemini API
   const aiResponse = await axios.post(
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
     {
       contents: [
         {
           parts: [{ text }]
         }
       ],
       generationConfig: {
         maxOutputTokens: maxToken || 150
       }
     },
     {
       headers: {
         "Content-Type": "application/json",
         "X-goog-api-key": "AIzaSyAEUIzAoidBjuX4IZIYb7jP7SN6o_qQgMI" // Replace with actual API key
       }
     }
   )

   // Extract generated content from the response
   const genratedContent =
     aiResponse.data?.candidates?.[0]?.content?.[0]?.text ||
     aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
     "No data"

   console.log(res)

   res.status(200).json({
     data: genratedContent
   })
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({
      message: "Failed to generate content",
    });
  }
};
