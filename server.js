import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import reservationRoutes from "./routes/reservationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//serve static files from the "client" directory
app.use(express.static(path.join(__dirname, "client")));

app.use("/reserve", reservationRoutes);
app.use("/user", userRoutes);


// serve html files for specific routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "home.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "adminPage.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "signup.html"));
});

app.get("/reserve", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "reserve.html"));
});

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "view.html"));
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


//Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  })
})