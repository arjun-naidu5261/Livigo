import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import amenitiesRoutes from "./routes/amenities.js";
import pgsRoutes from "./routes/pgs.js";
import bookingsRoutes from "./routes/bookings.js";
import ownerRoutes from "./routes/owner.js";
import adminRoutes from "./routes/admin.js";
import tenantRoutes from "./routes/tenant.js";
import { Amenity } from "./models/Amenity.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/pgs", pgsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tenant", tenantRoutes);

async function start() {
  await connectDB();

  const amenityCount = await Amenity.countDocuments();
  if (amenityCount === 0) {
    const defaults = [
      { name: "WiFi", icon: "wifi" },
      { name: "AC", icon: "wind" },
      { name: "Food (3 meals)", icon: "utensils-crossed" },
      { name: "Laundry", icon: "shirt" },
      { name: "Gym", icon: "dumbbell" },
      { name: "CCTV", icon: "camera" },
      { name: "Power Backup", icon: "zap" },
      { name: "Parking", icon: "car" },
      { name: "Hot Water", icon: "flame" },
      { name: "Housekeeping", icon: "sparkles" },
      { name: "TV", icon: "tv" },
      { name: "Fridge", icon: "refrigerator" },
    ];
    await Amenity.insertMany(defaults);
    console.log("Default amenities seeded");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
