import express from "express";
import Reservation from "../models/Reservation.js";
import { errorHandler } from "../utils/error.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// Table availability structure
const tables = {
    single: 10,
    double: 5,
    familyOfThree: 10,
    familyOfFour: 5,
    familyOfFive: 6
};

const getTableType = (guests) => {
    if (guests === 1) return 'single';
    if (guests === 2) return 'double';
    if (guests === 3) return 'familyOfThree';
    if (guests === 4) return 'familyOfFour';
    if (guests === 5) return 'familyOfFive';
    return null;
};

// Create a new reservation
router.post("/create", verifyToken, async (req, res, next) => {
  try {
    const { name, guests, date, time, menu, userRef } = req.body;
    const tableType = getTableType(guests);

    if (!tableType) {
      return res.status(400).json({ message: "Invalid number of guests" });
    }

    // Check table availability
    if (tables[tableType] <= 0) {
      return res.status(400).json({ message: "No available tables for this size" });
    }

    const reservation = new Reservation({ name, guests, date, time, menu, tableType, userRef });
    await reservation.save();

    // Decrement the table count
    tables[tableType]--;

    res.status(201).json({ message: "Seats Reserved Successfully", reservation });
  } catch (error) {
    next(error);
  }
});

// Get a reservation
router.get("/get/:id", async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return next(errorHandler(401, "Reservation not found"));
    }
    res.status(200).json(reservation);
  } catch (error) {
    next(error);
  }
});

// Update a reservation
router.put("/update/:id", verifyToken, async (req, res, next) => {
  const { name, guests, date, time, menu, userRef } = req.body;
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (new Date(reservation.date) - new Date() < 86400000) {
      return res.status(400).json({
        message: "Cannot update reservation less than a day in advance",
      });
    }

    const oldTableType = reservation.tableType;
    const newTableType = getTableType(guests);

    if (!newTableType) {
      return res.status(400).json({ message: "Invalid number of guests" });
    }

    if (oldTableType !== newTableType && tables[newTableType] <= 0) {
      return res.status(400).json({ message: "No available tables for this size" });
    }

    reservation.name = name;
    reservation.guests = guests;
    reservation.date = date;
    reservation.time = time;
    reservation.menu = menu;
    reservation.tableType = newTableType;
    reservation.userRef = userRef;

    await reservation.save();

    // Update table counts if table type has changed
    if (oldTableType !== newTableType) {
      tables[oldTableType]++;
      tables[newTableType]--;
    }

    res.status(201).json({ message: "Reservation updated successfully", reservation });
  } catch (error) {
    next(error);
  }
});

// Delete a reservation
router.delete("/delete/:id", verifyToken, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return next(errorHandler(404, "Reservation not found!"));
    }
    if (req.user.id !== reservation.userRef) {
      return next(errorHandler(401, "You can only delete your own reservation"));
    }

    const tableType = reservation.tableType;
    await Reservation.findByIdAndDelete(req.params.id);
    
    // Increment the table count
    tables[tableType]++;

    res.status(200).json("Reservation has been deleted");
  } catch (error) {
    next(error);
  }
});

export default router;
