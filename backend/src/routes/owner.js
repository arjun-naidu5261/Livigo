import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Router } from "express";
import { PG } from "../models/PG.js";
import { PGImage } from "../models/PGImage.js";
import { Room } from "../models/Room.js";
import { RoomImage } from "../models/RoomImage.js";
import { Bed } from "../models/Bed.js";
import { Booking } from "../models/Booking.js";
import { Ticket } from "../models/Ticket.js";
import { PaymentDue } from "../models/PaymentDue.js";
import { Announcement } from "../models/Announcement.js";
import { User } from "../models/User.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { formatDoc, formatDocs } from "../utils/helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads/pg-images");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const router = Router();
router.use(authenticate, requireRole("owner", "admin"));

function publicUrl(filename) {
  return `/uploads/pg-images/${filename}`;
}

async function getOwnerPGs(userId) {
  const pgs = await PG.find({ owner_id: userId }).sort({ created_at: -1 });
  const result = [];

  for (const pg of pgs) {
    const [rooms, images] = await Promise.all([
      Room.find({ pg_id: pg._id }),
      PGImage.find({ pg_id: pg._id }).sort({ display_order: 1 }),
    ]);

    const roomIds = rooms.map((r) => r._id);
    const beds = await Bed.find({ room_id: { $in: roomIds } });
    const bedsByRoom = {};
    beds.forEach((b) => {
      const key = String(b.room_id);
      if (!bedsByRoom[key]) bedsByRoom[key] = [];
      bedsByRoom[key].push(formatDoc(b));
    });

    result.push({
      ...formatDoc(pg),
      rooms: rooms.map((room) => ({
        ...formatDoc(room),
        beds: bedsByRoom[String(room._id)] || [],
      })),
      pg_images: formatDocs(images),
      pg_amenities: (pg.amenity_ids || []).map((id) => ({ amenity_id: String(id) })),
    });
  }

  return result;
}

router.get("/pgs", async (req, res) => {
  try {
    res.json(await getOwnerPGs(req.userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pgs", upload.any(), async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      area,
      gender,
      amenityIds,
      rules,
      rooms,
    } = req.body;

    const parsedRooms = rooms ? JSON.parse(rooms) : [];
    const parsedAmenityIds = amenityIds ? JSON.parse(amenityIds) : [];
    const parsedRules = rules ? JSON.parse(rules) : [];

    const pg = await PG.create({
      owner_id: req.userId,
      name,
      description,
      address,
      city,
      area,
      gender: gender || "coliving",
      amenity_ids: parsedAmenityIds,
      rules: parsedRules,
    });

    const buildingFiles = (req.files || []).filter((f) => f.fieldname === "buildingImages");
    for (let i = 0; i < buildingFiles.length; i++) {
      const file = buildingFiles[i];
      await PGImage.create({
        pg_id: pg._id,
        url: publicUrl(file.filename),
        display_order: i,
      });
    }

    for (const room of parsedRooms) {
      const roomDoc = await Room.create({
        pg_id: pg._id,
        name: room.name,
        sharing_type: room.sharingType,
        price_per_month: room.pricePerMonth,
        total_beds: room.totalBeds,
        has_ac: room.hasAc,
      });

      const beds = Array.from({ length: room.totalBeds }, (_, i) => ({
        room_id: roomDoc._id,
        bed_number: i + 1,
        status: "available",
      }));
      await Bed.insertMany(beds);

      const roomFiles = (req.files || []).filter((f) => f.fieldname === `roomImages_${room.tempId}`);
      for (let i = 0; i < roomFiles.length; i++) {
        await RoomImage.create({
          room_id: roomDoc._id,
          url: publicUrl(roomFiles[i].filename),
          display_order: i,
        });
      }
    }

    res.status(201).json(formatDoc(pg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/pgs/:id", async (req, res) => {
  try {
    const pg = await PG.findOne({ _id: req.params.id, owner_id: req.userId });
    if (!pg) return res.status(404).json({ error: "PG not found" });

    const allowed = ["name", "description", "address", "city", "area", "gender"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) pg[key] = req.body[key];
    });
    await pg.save();
    res.json(formatDoc(pg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/rooms", async (req, res) => {
  try {
    const { pgId, name, sharingType, pricePerMonth, totalBeds, hasAc } = req.body;
    const pg = await PG.findOne({ _id: pgId, owner_id: req.userId });
    if (!pg) return res.status(404).json({ error: "PG not found" });

    const room = await Room.create({
      pg_id: pgId,
      name,
      sharing_type: sharingType,
      price_per_month: pricePerMonth,
      total_beds: totalBeds,
      has_ac: hasAc,
    });

    const beds = Array.from({ length: totalBeds }, (_, i) => ({
      room_id: room._id,
      bed_number: i + 1,
      status: "available",
    }));
    await Bed.insertMany(beds);

    res.status(201).json(formatDoc(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/rooms/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const pg = await PG.findOne({ _id: room.pg_id, owner_id: req.userId });
    if (!pg) return res.status(403).json({ error: "Not authorized" });

    const map = {
      name: "name",
      price_per_month: "price_per_month",
      has_ac: "has_ac",
      has_attached_bathroom: "has_attached_bathroom",
    };
    Object.entries(map).forEach(([bodyKey, modelKey]) => {
      if (req.body[bodyKey] !== undefined) room[modelKey] = req.body[bodyKey];
    });
    await room.save();
    res.json(formatDoc(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/beds/:id", async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ error: "Bed not found" });

    const room = await Room.findById(bed.room_id);
    const pg = await PG.findOne({ _id: room.pg_id, owner_id: req.userId });
    if (!pg) return res.status(403).json({ error: "Not authorized" });

    bed.status = req.body.newStatus || req.body.status;
    await bed.save();
    res.json(formatDoc(bed));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const pgs = await PG.find({ owner_id: req.userId }).select("_id name");
    if (!pgs.length) return res.json([]);

    const pgIds = pgs.map((p) => p._id);
    const pgMap = {};
    pgs.forEach((p) => {
      pgMap[String(p._id)] = formatDoc(p);
    });

    const bookings = await Booking.find({ pg_id: { $in: pgIds } }).sort({ created_at: -1 });
    const populated = await Promise.all(
      bookings.map(async (booking) => {
        const [room, bed] = await Promise.all([
          Room.findById(booking.room_id).select("name"),
          Bed.findById(booking.bed_id).select("bed_number"),
        ]);
        return {
          ...formatDoc(booking),
          pgs: pgMap[String(booking.pg_id)] || null,
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

router.get("/tickets", async (req, res) => {
  try {
    const pgs = await PG.find({ owner_id: req.userId }).select("_id name");
    const pgIds = pgs.map((p) => p._id);
    const pgMap = {};
    pgs.forEach((p) => {
      pgMap[String(p._id)] = formatDoc(p);
    });

    const tickets = await Ticket.find({ pg_id: { $in: pgIds } }).sort({ created_at: -1 });
    res.json(
      tickets.map((t) => ({
        ...formatDoc(t),
        pgs: pgMap[String(t.pg_id)] || null,
      }))
    );
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

router.patch("/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const pg = await PG.findOne({ _id: ticket.pg_id, owner_id: req.userId });
    if (!pg && !req.userRoles.includes("admin")) {
      return res.status(403).json({ error: "Not authorized" });
    }

    ticket.status = req.body.status;
    if (req.body.status === "resolved") ticket.resolved_at = new Date();
    await ticket.save();
    res.json(formatDoc(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/payment-dues", async (req, res) => {
  try {
    const dues = await PaymentDue.find({ owner_id: req.userId }).sort({ due_date: -1 });
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

router.post("/payment-dues", async (req, res) => {
  try {
    const { bookingId, pgId, tenantId, amount, dueDate, notes } = req.body;
    const due = await PaymentDue.create({
      booking_id: bookingId,
      pg_id: pgId,
      tenant_id: tenantId,
      owner_id: req.userId,
      amount,
      due_date: dueDate,
      notes,
    });
    res.status(201).json(formatDoc(due));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/payment-dues/:id", async (req, res) => {
  try {
    const due = await PaymentDue.findOne({ _id: req.params.id, owner_id: req.userId });
    if (!due) return res.status(404).json({ error: "Payment due not found" });

    const allowed = ["status", "paid_date", "payment_method", "transaction_ref"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) due[key] = req.body[key];
    });
    await due.save();
    res.json(formatDoc(due));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const pgs = await PG.find({ owner_id: req.userId }).select("_id name");
    if (!pgs.length) return res.json([]);

    const pgIds = pgs.map((p) => p._id);
    const pgMap = {};
    pgs.forEach((p) => {
      pgMap[String(p._id)] = formatDoc(p);
    });

    const announcements = await Announcement.find({ pg_id: { $in: pgIds } }).sort({ created_at: -1 });
    res.json(
      announcements.map((a) => ({
        ...formatDoc(a),
        pgs: pgMap[String(a.pg_id)] || null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const { pgId, title, message } = req.body;
    const pg = await PG.findOne({ _id: pgId, owner_id: req.userId });
    if (!pg) return res.status(404).json({ error: "PG not found" });

    const announcement = await Announcement.create({ pg_id: pgId, title, message });
    res.status(201).json(formatDoc(announcement));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });

    const pg = await PG.findOne({ _id: announcement.pg_id, owner_id: req.userId });
    if (!pg) return res.status(403).json({ error: "Not authorized" });

    await announcement.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
