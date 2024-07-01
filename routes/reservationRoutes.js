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
  familyOfFive: 6,
};

const getGuestsFromTableType = (tableType) => {
  switch (tableType) {
    case 'single': return 1;
    case 'double': return 2;
    case 'familyOfThree': return 3;
    case 'familyOfFour': return 4;
    case 'familyOfFive': return 5;
    default: return 0;
  }
};

// Create a new reservation
router.post("/create", verifyToken, async (req, res, next) => {
  try {
    const { name, tableType, date, time, menu, userRef } = req.body;

    if (!tables[tableType]) {
      return res.status(400).json({ message: "Invalid table type" });
    }

    if (tables[tableType] <= 0) {
      return res.status(400).json({ message: "No available tables for this type" });
    }

    const guests = getGuestsFromTableType(tableType);
    const reservation = new Reservation({ name, guests, date, time, menu, tableType, userRef });
    await reservation.save();

    tables[tableType]--;

    res.status(201).json({ message: "Seats Reserved Successfully", reservation });
  } catch (error) {
    next(error);
  }
});

router.get("/getReservation/:id", verifyToken, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (req.user.id!== reservation.userRef) {
      return res.status(401).json({ message: "You can only view your own reservation" });
    }

    res.status(200).json(reservation);
  } catch (error) {
    next(error);
  }
})
// Update a reservation
router.put("/update/:id", verifyToken, async (req, res, next) => {
  const { name, tableType, date, time, menu, userRef } = req.body;
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (req.user.id !== reservation.userRef) {
      return res.status(401).json({ message: "You can only update your own reservation" });
    }

    if (new Date(reservation.date) - new Date() < 86400000) {
      return res.status(400).json({
        message: "Cannot update reservation less than a day in advance",
      });
    }

    if (!tables[tableType]) {
      return res.status(400).json({ message: "Invalid table type" });
    }

    if (reservation.tableType !== tableType && tables[tableType] <= 0) {
      return res.status(400).json({ message: "No available tables for this type" });
    }

    const guests = getGuestsFromTableType(tableType);

    reservation.name = name;
    reservation.guests = guests;
    reservation.date = date;
    reservation.time = time;
    reservation.menu = menu;
    reservation.tableType = tableType;
    reservation.userRef = userRef;

    await reservation.save();

    if (reservation.tableType !== tableType) {
      tables[reservation.tableType]++;
      tables[tableType]--;
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
