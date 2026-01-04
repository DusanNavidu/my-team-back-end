"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const organizer_1 = __importDefault(require("./routes/organizer"));
const event_1 = __importDefault(require("./routes/event"));
const playerDetails_1 = __importDefault(require("./routes/playerDetails"));
const post_1 = __importDefault(require("./routes/post"));
const application_1 = __importDefault(require("./routes/application"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const MONGO_URI = process.env.MONGO_URI;
// CORS - Vercel සඳහා credentials true සහ optionsSuccessStatus එකතු කරන්න
app.use((0, cors_1.default)({
    origin: ["https://my-team-front-end-seven.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204
}));
app.use(express_1.default.json());
// Database connection logic (Cached connection)
let isConnected = false;
const connectToDatabase = async () => {
    if (isConnected)
        return;
    try {
        await mongoose_1.default.connect(MONGO_URI);
        isConnected = true;
        console.log("✅ DB connected");
    }
    catch (err) {
        console.error("❌ DB error:", err);
    }
};
// Middleware to connect to DB on every request (Serverless සඳහා)
app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});
// Routes
app.use("/api/v1/auth", auth_1.default);
app.use("/api/v1/organizer", organizer_1.default);
app.use("/api/v1/event", event_1.default);
app.use("/api/v1/player", playerDetails_1.default);
app.use("/api/v1/post", post_1.default);
app.use("/api/v1/applications", application_1.default);
app.get("/", (req, res) => {
    res.send("Backend is running...");
});
// Vercel එකේදී app.listen අවශ්‍ය නැත. 
// local test කිරීමට පමණක් මෙය පාවිච්චි කරන්න:
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
// මෙය අනිවාර්යයි!
exports.default = app;
