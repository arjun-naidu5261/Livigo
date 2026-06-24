import mongoose from "mongoose";

const bedSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    bed_number: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "locked", "maintenance"],
      default: "available",
    },
    occupied_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    locked_until: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Bed = mongoose.model("Bed", bedSchema);
