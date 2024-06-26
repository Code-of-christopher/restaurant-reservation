import express from "express";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import User from "../models/User.js";
import Reservation from "../models/Reservation.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/verifyUser.js";
const router = express.Router();

// User registration
router.post("/signup", async (req, res, next) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json({message: "User Created Successfully", newUser});
  } catch (error) {
    next(error);
  }
});

// User login
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found"));
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials"));
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 72 * 60 * 60 * 1000),
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
});

//User Logout
router.get("/logout", (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
});

// Get a reservation
router.get("/getReservation/:id", verifyToken, async (req, res, next) => {
  if (req.user.id === req.params.id) {
  try {
    const reservation = await Reservation.find({ userRef: req.params.id});
    if (!reservation) {
      return next(errorHandler(401, "Reservation not found"));
    }
    res.status(200).json(reservation);
  } catch (error) {
    next(error);
  }} else{
    return next(errorHandler(401, "You can only view your own reservation"));
  }
});

export default router;
