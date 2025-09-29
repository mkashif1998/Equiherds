import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const coordinatesSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const trainerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  details: { type: String, required: true },
  price: { type: Number, required: true },
  schedule: { type: scheduleSchema, required: true },
  Experience: { type: String, required: true },
  Rating: { type: Number, required: false },
  status: { type: String, required: true, default: "active" },
  location: { type: String, required: true },
  coordinates: { type: coordinatesSchema, required: true },
  images: [{ type: String }]
}, {
  timestamps: true
});

// Avoid OverwriteModelError in Next.js (hot reload)
const Trainer = mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);

export default Trainer;
