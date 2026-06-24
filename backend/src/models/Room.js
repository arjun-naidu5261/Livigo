import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    name: { type: String, required: true },
    sharing_type: { type: Number, default: 1 },
    price_per_month: { type: Number, required: true },
    total_beds: { type: Number, default: 1 },
    has_ac: { type: Boolean, default: false },
    has_attached_bathroom: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Room = mongoose.model("Room", roomSchema);
