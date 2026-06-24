import mongoose from "mongoose";

const paymentDueSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    due_date: { type: String, required: true },
    paid_date: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "partial"],
      default: "pending",
    },
    payment_method: { type: String, default: null },
    transaction_ref: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const PaymentDue = mongoose.model("PaymentDue", paymentDueSchema);
