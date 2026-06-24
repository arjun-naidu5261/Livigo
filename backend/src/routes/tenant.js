import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { PaymentDue } from "../models/PaymentDue.js";
import { Ticket } from "../models/Ticket.js";
import { Announcement } from "../models/Announcement.js";
import { PG } from "../models/PG.js";
import { Room } from "../models/Room.js";
import { Bed } from "../models/Bed.js";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { formatDoc } from "../utils/helpers.js";

const router = Router();
router.use(authenticate);

router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.userId }).sort({ created_at: -1 });
    const populated = await Promise.all(
      bookings.map(async (booking) => {
        const [pg, room, bed] = await Promise.all([
          PG.findById(booking.pg_id).select("name address city area"),
          Room.findById(booking.room_id).select("name price_per_month has_ac sharing_type"),
          Bed.findById(booking.bed_id).select("bed_number"),
        ]);
        return {
          ...formatDoc(booking),
          pgs: pg ? formatDoc(pg) : null,
          rooms: room ? formatDoc(room) : null,
          beds: bed ? formatDoc(bed) : null,
        };
      })
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/payment-dues", async (req, res) => {
  try {
    const dues = await PaymentDue.find({ tenant_id: req.userId }).sort({ due_date: -1 });
    const populated = await Promise.all(
      dues.map(async (due) => {
        const [pg, booking, room, bed] = await Promise.all([
          PG.findById(due.pg_id).select("name"),
          Booking.findById(due.booking_id),
          Room.findById((await Booking.findById(due.booking_id))?.room_id).select("name"),
          Bed.findById((await Booking.findById(due.booking_id))?.bed_id).select("bed_number"),
        ]);
        return {
          ...formatDoc(due),
          pgs: pg ? formatDoc(pg) : null,
          bookings: booking
            ? {
                ...formatDoc(booking),
                rooms: room ? formatDoc(room) : null,
                beds: bed ? formatDoc(bed) : null,
              }
            : null,
        };
      })
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/payment-dues/:id/pay", async (req, res) => {
  try {
    const due = await PaymentDue.findOne({ _id: req.params.id, tenant_id: req.userId });
    if (!due) return res.status(404).json({ error: "Payment due not found" });

    due.status = "paid";
    due.paid_date = new Date().toISOString().split("T")[0];
    due.payment_method = req.body.paymentMethod || null;
    due.transaction_ref = req.body.transactionRef || null;
    await due.save();
    res.json(formatDoc(due));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find({ raised_by: req.userId }).sort({ created_at: -1 });
    const populated = await Promise.all(
      tickets.map(async (ticket) => {
        const pg = await PG.findById(ticket.pg_id).select("name");
        return {
          ...formatDoc(ticket),
          pgs: pg ? formatDoc(pg) : null,
        };
      })
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tickets", async (req, res) => {
  try {
    const { pgId, subject, description, priority } = req.body;
    const ticket = await Ticket.create({
      pg_id: pgId,
      raised_by: req.userId,
      subject,
      description,
      priority: priority || "medium",
    });
    res.status(201).json(formatDoc(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const bookings = await Booking.find({
      user_id: req.userId,
      status: { $in: ["pending", "confirmed"] },
    }).select("pg_id");

    if (!bookings.length) return res.json([]);

    const pgIds = [...new Set(bookings.map((b) => String(b.pg_id)))];
    const announcements = await Announcement.find({
      pg_id: { $in: pgIds },
      is_active: true,
    }).sort({ created_at: -1 });

    const populated = await Promise.all(
      announcements.map(async (a) => {
        const pg = await PG.findById(a.pg_id).select("name");
        return {
          ...formatDoc(a),
          pgs: pg ? formatDoc(pg) : null,
        };
      })
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.fullName !== undefined) user.full_name = req.body.fullName;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    await user.save();
    res.json(formatDoc(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
