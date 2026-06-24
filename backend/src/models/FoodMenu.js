import mongoose from "mongoose";

const dayMenuSchema = new mongoose.Schema(
  {
    breakfast: { type: String, default: "" },
    lunch: { type: String, default: "" },
    dinner: { type: String, default: "" },
  },
  { _id: false }
);

const emptyDay = () => ({ breakfast: "", lunch: "", dinner: "" });

const foodMenuSchema = new mongoose.Schema(
  {
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true, unique: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    monday: { type: dayMenuSchema, default: emptyDay },
    tuesday: { type: dayMenuSchema, default: emptyDay },
    wednesday: { type: dayMenuSchema, default: emptyDay },
    thursday: { type: dayMenuSchema, default: emptyDay },
    friday: { type: dayMenuSchema, default: emptyDay },
    saturday: { type: dayMenuSchema, default: emptyDay },
    sunday: { type: dayMenuSchema, default: emptyDay },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const FoodMenu = mongoose.model("FoodMenu", foodMenuSchema);

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function defaultWeekMenu() {
  return Object.fromEntries(WEEK_DAYS.map((day) => [day, emptyDay()]));
}
