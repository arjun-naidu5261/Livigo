import { Router } from "express";
import { PG } from "../models/PG.js";
import { Room } from "../models/Room.js";
import { Bed } from "../models/Bed.js";
import { PGImage } from "../models/PGImage.js";
import { Amenity } from "../models/Amenity.js";
import { Booking } from "../models/Booking.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { formatDoc, formatDocs } from "../utils/helpers.js";

const router = Router();
router.use(authenticate, requireRole("admin"));

router.get("/pgs", async (_req, res) => {
  try {
    const pgs = await PG.find().sort({ created_at: -1 });
    const ownerIds = [...new Set(pgs.map((p) => String(p.owner_id)))];
    const owners = await User.find({ _id: { $in: ownerIds } });
    const ownerMap = {};
    owners.forEach((o) => {
      ownerMap[String(o._id)] = {
        user_id: String(o._id),
        full_name: o.full_name,
        phone: o.phone,
      };
    });

    const result = [];
    for (const pg of pgs) {
      const [rooms, images] = await Promise.all([
        Room.find({ pg_id: pg._id }),
        PGImage.find({ pg_id: pg._id }),
      ]);
      const roomIds = rooms.map((r) => r._id);
      const beds = await Bed.find({ room_id: { $in: roomIds } });
      const bedsByRoom = {};
      beds.forEach((b) => {
        const key = String(b.room_id);
        if (!bedsByRoom[key]) bedsByRoom[key] = [];
        bedsByRoom[key].push(formatDoc(b));
      });

      const amenities = await Amenity.find({ _id: { $in: pg.amenity_ids || [] } });

      result.push({
        ...formatDoc(pg),
        rooms: rooms.map((room) => ({
          ...formatDoc(room),
          beds: bedsByRoom[String(room._id)] || [],
        })),
        pg_images: formatDocs(images),
        pg_amenities: amenities.map((a) => ({ amenities: formatDoc(a) })),
        profiles: ownerMap[String(pg.owner_id)] || null,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/pgs/:id/approve", async (req, res) => {
  try {
    const { verified, isActive } = req.body;
    const pg = await PG.findByIdAndUpdate(
      req.params.id,
      { verified, is_active: isActive },
      { new: true }
    );
    if (!pg) return res.status(404).json({ error: "PG not found" });
    res.json(formatDoc(pg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const [pgs, bookings, reviews, users] = await Promise.all([
      PG.find().select("verified is_active"),
      Booking.find().select("status"),
      Review.countDocuments(),
      User.countDocuments(),
    ]);

    res.json({
      totalPGs: pgs.length,
      verifiedPGs: pgs.filter((p) => p.verified).length,
      pendingPGs: pgs.filter((p) => !p.verified).length,
      inactivePGs: pgs.filter((p) => !p.is_active).length,
      totalBookings: bookings.length,
      totalReviews: reviews,
      totalUsers: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "email, password, and role are required" });
    }
    if (!["admin", "owner", "tenant"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      email,
      password,
      full_name: role === "admin" ? "Admin" : email.split("@")[0],
      roles: [role],
    });

    res.status(201).json({
      success: true,
      userId: String(user._id),
      email: user.email,
      role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
