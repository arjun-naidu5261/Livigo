import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: null },
});

export const Amenity = mongoose.model("Amenity", amenitySchema);
