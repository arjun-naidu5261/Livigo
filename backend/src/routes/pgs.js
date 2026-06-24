import mongoose from "mongoose";
import { Router } from "express";
import { PG } from "../models/PG.js";
import { PGImage } from "../models/PGImage.js";
import { Room } from "../models/Room.js";
import { RoomImage } from "../models/RoomImage.js";
import { Bed } from "../models/Bed.js";
import { Review } from "../models/Review.js";
import { Amenity } from "../models/Amenity.js";
import { User } from "../models/User.js";
import { optionalAuth } from "../middleware/auth.js";
import { formatDoc, formatDocs } from "../utils/helpers.js";

const router = Router();

async function buildPGAvailability(filters = {}, userId = null, userRoles = []) {
  const query = { is_active: true };
  if (filters.city) query.city = { $regex: filters.city, $options: "i" };
  if (filters.gender) query.gender = filters.gender;

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { city: { $regex: filters.search, $options: "i" } },
      { area: { $regex: filters.search, $options: "i" } },
    ];
  }

  if (userRoles.includes("admin") || userId) {
    // admins and owners may see inactive via separate endpoints
  }

  const pgs = await PG.find(query).lean();
  const pgIds = pgs.map((p) => p._id);

  const [rooms, beds, reviews, amenities] = await Promise.all([
    Room.find({ pg_id: { $in: pgIds } }).lean(),
    Bed.find({ room_id: { $in: [] } }).lean(),
    Review.find({ pg_id: { $in: pgIds } }).lean(),
    Amenity.find().lean(),
  ]);

  const roomIds = rooms.map((r) => r._id);
  const allBeds = await Bed.find({ room_id: { $in: roomIds } }).lean();

  const roomsByPg = {};
  rooms.forEach((r) => {
    if (!roomsByPg[String(r.pg_id)]) roomsByPg[String(r.pg_id)] = [];
    roomsByPg[String(r.pg_id)].push(r);
  });

  const bedsByRoom = {};
  allBeds.forEach((b) => {
    if (!bedsByRoom[String(b.room_id)]) bedsByRoom[String(b.room_id)] = [];
    bedsByRoom[String(b.room_id)].push(b);
  });

  const reviewsByPg = {};
  reviews.forEach((rev) => {
    if (!reviewsByPg[String(rev.pg_id)]) reviewsByPg[String(rev.pg_id)] = [];
    reviewsByPg[String(rev.pg_id)].push(rev);
  });

  const amenityMap = {};
  amenities.forEach((a) => {
    amenityMap[String(a._id)] = a;
  });

  let results = pgs.map((pg) => {
    const pgRooms = roomsByPg[String(pg._id)] || [];
    let minPrice = 0;
    let availableBeds = 0;
    let totalBeds = 0;

    pgRooms.forEach((room) => {
      if (!minPrice || room.price_per_month < minPrice) minPrice = room.price_per_month;
      const roomBeds = bedsByRoom[String(room._id)] || [];
      totalBeds += roomBeds.length;
      availableBeds += roomBeds.filter((b) => b.status === "available").length;
    });

    const pgReviews = reviewsByPg[String(pg._id)] || [];
    const avgRating = pgReviews.length
      ? Math.round((pgReviews.reduce((s, r) => s + r.rating, 0) / pgReviews.length) * 10) / 10
      : 0;

    return {
      id: String(pg._id),
      name: pg.name,
      description: pg.description,
      address: pg.address,
      city: pg.city,
      area: pg.area,
      latitude: pg.latitude,
      longitude: pg.longitude,
      gender: pg.gender,
      verified: pg.verified,
      owner_id: String(pg.owner_id),
      created_at: pg.created_at,
      min_price: minPrice,
      available_beds: availableBeds,
      total_beds: totalBeds,
      avg_rating: avgRating,
      review_count: pgReviews.length,
      amenity_ids: (pg.amenity_ids || []).map(String),
    };
  });

  if (filters.amenities) {
    const wanted = filters.amenities.split(",").filter(Boolean);
    if (wanted.length > 0) {
      const amenityNameToId = {};
      amenities.forEach((a) => {
        amenityNameToId[a.name] = String(a._id);
      });
      const wantedIds = wanted.map((name) => amenityNameToId[name]).filter(Boolean);
      results = results.filter((pg) =>
        wantedIds.every((id) => pg.amenity_ids.includes(id))
      );
    }
  }

  return results;
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { city, gender, search, amenities } = req.query;
    const genderMap = { Boys: "boys", Girls: "girls", "Co-living": "coliving" };
    const mappedGender = gender && gender !== "All" ? genderMap[gender] || gender : undefined;

    const results = await buildPGAvailability(
      { city, gender: mappedGender, search, amenities },
      req.userId,
      req.userRoles || []
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const pgId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pgId)) {
      return res.status(400).json({ error: "Invalid PG id" });
    }

    const pg = await PG.findById(pgId);
    if (!pg) return res.status(404).json({ error: "PG not found" });

    const [images, rooms, amenities, reviews] = await Promise.all([
      PGImage.find({ pg_id: pgId }).sort({ display_order: 1 }),
      Room.find({ pg_id: pgId }),
      Amenity.find({ _id: { $in: pg.amenity_ids || [] } }),
      Review.find({ pg_id: pgId }).sort({ created_at: -1 }),
    ]);

    const roomIds = rooms.map((r) => r._id);
    const [beds, roomImages, reviewUsers] = await Promise.all([
      Bed.find({ room_id: { $in: roomIds } }),
      RoomImage.find({ room_id: { $in: roomIds } }).sort({ display_order: 1 }),
      User.find({ _id: { $in: reviews.map((r) => r.user_id) } }),
    ]);

    const userMap = {};
    reviewUsers.forEach((u) => {
      userMap[String(u._id)] = formatDoc(u);
    });

    const bedsByRoom = {};
    beds.forEach((b) => {
      const key = String(b.room_id);
      if (!bedsByRoom[key]) bedsByRoom[key] = [];
      bedsByRoom[key].push(formatDoc(b));
    });

    const roomImagesByRoom = {};
    roomImages.forEach((img) => {
      const key = String(img.room_id);
      if (!roomImagesByRoom[key]) roomImagesByRoom[key] = [];
      roomImagesByRoom[key].push(formatDoc(img));
    });

    const formattedRooms = rooms.map((room) => {
      const roomBeds = bedsByRoom[String(room._id)] || [];
      return {
        ...formatDoc(room),
        beds: roomBeds,
        available_beds: roomBeds.filter((b) => b.status === "available").length,
        room_images: roomImagesByRoom[String(room._id)] || [],
      };
    });

    const formattedReviews = reviews.map((rev) => {
      const user = userMap[String(rev.user_id)];
      return {
        ...formatDoc(rev),
        profiles: user
          ? { full_name: user.full_name, avatar_url: user.avatar_url }
          : null,
      };
    });

    res.json({
      pg: formatDoc(pg),
      images: formatDocs(images),
      rooms: formattedRooms,
      amenities: formatDocs(amenities),
      rules: pg.rules || [],
      reviews: formattedReviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/images", async (req, res) => {
  try {
    const images = await PGImage.find({ pg_id: req.params.id }).sort({ display_order: 1 });
    res.json(formatDocs(images));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
