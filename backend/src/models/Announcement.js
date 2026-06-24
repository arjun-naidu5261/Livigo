import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
