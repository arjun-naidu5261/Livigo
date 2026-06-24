import { Router } from "express";
import { Amenity } from "../models/Amenity.js";
import { formatDoc, formatDocs } from "../utils/helpers.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const amenities = await Amenity.find().sort({ name: 1 });
    res.json(formatDocs(amenities));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
