import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    food_rating: { type: Number, min: 1, max: 5, default: null },
    cleanliness_rating: { type: Number, min: 1, max: 5, default: null },
    safety_rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

reviewSchema.index({ user_id: 1, pg_id: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
