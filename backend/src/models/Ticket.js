import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    raised_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
