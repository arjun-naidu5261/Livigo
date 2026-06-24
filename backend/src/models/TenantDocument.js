import mongoose from "mongoose";

const tenantDocumentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    doc_type: { type: String, enum: ["kyc", "agreement", "rulebook"], required: true },
    file_url: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const TenantDocument = mongoose.model("TenantDocument", tenantDocumentSchema);
