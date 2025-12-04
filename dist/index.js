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
const post_1 = __importDefault(require("./routes/post"));
const ai_1 = __importDefault(require("./routes/ai"));
const auth_2 = require("./middleware/auth");
const role_1 = require("./middleware/role");
const user_model_1 = require("./models/user.model");
dotenv_1.default.config();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://rad-72-sample-fe.vercel.app/login"],
    methods: ["GET", "POST", "PUT", "DELETE"] // optional
}));
app.use("/api/v1/auth", auth_1.default);
app.use("/api/v1/post", post_1.default);
app.use("/api/v1/ai", ai_1.default);
// sample route with auth
app.get("/", (req, res) => {
    res.send("Backend is running...");
});
// public
app.get("/test-1", (req, res) => { });
// protected
app.get("/test-2", auth_2.authenticate, (req, res) => { });
// admin only
app.get("/test-3", auth_2.authenticate, (0, role_1.requireRole)([user_model_1.Role.ADMIN]), (req, res) => { });
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("DB connected");
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
app.listen(PORT, () => {
    console.log("Server is running");
});
// --------------------------------------
// // Built in middlewares (Global)
// app.use(express.json())
// // Thrid party middlewares (Global)
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "DELETE"] // optional
//   })
// )
// // Global middleware
// app.use((req, res, next) => {
//   console.log("Hello")
//   if (true) {
//     next() // go forword
//   } else {
//     res.sendStatus(400) // stop
//   }
// })
// app.get("/hello", testMiddleware, (req, res) => {
//   //
//   res.send("")
// })
// app.get("/", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })
// app.get("/private", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })
// app.get("/test", (req, res) => {
//   res.status(200).send("Test Ok")
// })
// app.listen(5000, () => {
//   console.log("Server is running")
// })
// path params
// http://localhost:5000/1234
// http://localhost:5000/4321
// http://localhost:5000/hello
// app.get("/:id", (req, res) => {
//   const params = req.params
//   console.log(params)
//   console.log(params?.id)
//   res.status(200).send("Ok")
// })
// query params ?id=1234
// http://localhost:5000/?id=1234
// http://localhost:5000/?id=4321
// app.get("/", (req, res) => {
//   const params = req.query
//   console.log(params)
//   console.log(params?.id)
//   res.status(200).send("Ok")
// })
