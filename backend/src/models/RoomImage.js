import mongoose from "mongoose";

const roomImageSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    url: { type: String, required: true },
    display_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const RoomImage = mongoose.model("RoomImage", roomImageSchema);
