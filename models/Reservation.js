import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    time: {
      type: String,
      required: true,
    },
    menu: {
      type: String,
      required: true,
    },
    tableType: {
      type: String,
      required: true,
    },
    userRef: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
