import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    move_in_date: { type: String, required: true },
    monthly_rent: { type: Number, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Booking = mongoose.model("Booking", bookingSchema);
