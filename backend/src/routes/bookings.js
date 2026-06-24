import mongoose from "mongoose";
import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { Bed } from "../models/Bed.js";
import { PG } from "../models/PG.js";
import { Room } from "../models/Room.js";
import { authenticate } from "../middleware/auth.js";
import { formatDoc } from "../utils/helpers.js";

const router = Router();

async function populateBooking(booking) {
  const [pg, room, bed] = await Promise.all([
    PG.findById(booking.pg_id).select("name city address area"),
    Room.findById(booking.room_id).select("name price_per_month has_ac sharing_type"),
    Bed.findById(booking.bed_id).select("bed_number"),
  ]);

  return {
    ...formatDoc(booking),
    pgs: pg ? formatDoc(pg) : null,
    rooms: room ? formatDoc(room) : null,
    beds: bed ? formatDoc(bed) : null,
  };
}

router.get("/me", authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.userId }).sort({ created_at: -1 });
    const populated = await Promise.all(bookings.map(populateBooking));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { bedId, pgId, roomId, moveInDate, monthlyRent } = req.body;
    if (!bedId || !pgId || !roomId || !moveInDate || !monthlyRent) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    const bed = await Bed.findOneAndUpdate(
      { _id: bedId, status: "available" },
      {
        status: "locked",
        locked_until: new Date(Date.now() + 15 * 60 * 1000),
      },
      { new: true }
    );

    if (!bed) {
      return res.status(400).json({ error: "Bed is no longer available" });
    }

    try {
      const booking = await Booking.create({
        user_id: req.userId,
        bed_id: bedId,
        pg_id: pgId,
        room_id: roomId,
        move_in_date: moveInDate,
        monthly_rent: monthlyRent,
        status: "confirmed",
      });

      await Bed.findByIdAndUpdate(bedId, {
        status: "occupied",
        occupied_by: req.userId,
        locked_until: null,
      });

      res.status(201).json(formatDoc(booking));
    } catch (err) {
      await Bed.findByIdAndUpdate(bedId, { status: "available", locked_until: null });
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
