import { Amenity } from "../models/Amenity.js";
import { connectDB } from "../config/db.js";

const DEFAULT_AMENITIES = [
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

async function seed() {
  await connectDB();
  for (const amenity of DEFAULT_AMENITIES) {
    await Amenity.updateOne({ name: amenity.name }, amenity, { upsert: true });
  }
  console.log("Amenities seeded");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
