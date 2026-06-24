import mongoose from "mongoose";

const guestCheckInSchema = new mongoose.Schema(
  {
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    guest_name: { type: String, required: true },
    guest_phone: { type: String, required: true },
    advance_paid: { type: Number, default: 0 },
    check_in_date: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "checked_out"],
      default: "active",
    },
    checked_out_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

guestCheckInSchema.index({ bed_id: 1, status: 1 });

export const GuestCheckIn = mongoose.model("GuestCheckIn", guestCheckInSchema);
