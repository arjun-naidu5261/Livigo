import mongoose from "mongoose";

const pgImageSchema = new mongoose.Schema(
  {
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    url: { type: String, required: true },
    display_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const PGImage = mongoose.model("PGImage", pgImageSchema);
