import mongoose from "mongoose";

const pgSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    gender: { type: String, enum: ["boys", "girls", "coliving"], default: "coliving" },
    verified: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    rules: [{ type: String }],
    amenity_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

pgSchema.index({ city: 1 });
pgSchema.index({ gender: 1 });
pgSchema.index({ owner_id: 1 });

export const PG = mongoose.model("PG", pgSchema);
