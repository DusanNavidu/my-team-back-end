"use strict";
// src/index.ts
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
const ai_1 = __importDefault(require("./routes/ai"));
const auth_2 = require("./middleware/auth");
const role_1 = require("./middleware/role");
const user_model_1 = require("./models/user.model");
const createDefaultAdmin_1 = require("./utils/createDefaultAdmin");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://rad-72-sample-fe.vercel.app/login"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
app.use("/api/v1/auth", auth_1.default);
app.use("/api/v1/ai", ai_1.default);
app.use("/api/v1/organizer", organizer_1.default);
app.use("/api/v1/event", event_1.default);
app.use("/api/v1/player", playerDetails_1.default);
app.use("/api/v1/post", post_1.default);
app.use("/api/v1/applications", application_1.default);
app.get("/", (req, res) => {
    res.send("Backend is running...");
});
app.get("/test-1", (req, res) => { });
app.get("/test-2", auth_2.authenticate, (req, res) => { });
app.get("/test-3", auth_2.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), (req, res) => { });
const startServer = async () => {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");
        await (0, createDefaultAdmin_1.createDefaultAdmin)();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
