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

// Disciplines schema
const disciplinesSchema = new mongoose.Schema({
  dressage: { type: Boolean, default: false },
  showJumping: { type: Boolean, default: false },
  eventing: { type: Boolean, default: false },
  endurance: { type: Boolean, default: false },
  western: { type: Boolean, default: false },
  vaulting: { type: Boolean, default: false },
  dressagePrice: { type: Number, default: null },
  showJumpingPrice: { type: Number, default: null },
  eventingPrice: { type: Number, default: null },
  endurancePrice: { type: Number, default: null },
  westernPrice: { type: Number, default: null },
  vaultingPrice: { type: Number, default: null }
}, { _id: false });

// Training schema
const trainingSchema = new mongoose.Schema({
  onLocationLessons: { type: Boolean, default: false },
  lessonsOnTrainersLocation: { type: Boolean, default: false },
  onLocationLessonsPrice: { type: Number, default: null },
  lessonsOnTrainersLocationPrice: { type: Number, default: null }
}, { _id: false });

// Competition coaching schema
const competitionCoachingSchema = new mongoose.Schema({
  onLocationCoaching: { type: Boolean, default: false },
  onLocationCoachingPrice: { type: Number, default: null }
}, { _id: false });

const trainerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  details: { type: String, required: true },
  price: { type: Number, required: true },
  schedule: [scheduleSchema],
  Experience: { type: String, required: true },
  Rating: { type: Number, required: false },
  noofRatingCustomers: { type: Number, required: false },
  status: { type: String, required: true, default: "active" },
  location: { type: String, required: true },
  coordinates: { type: coordinatesSchema, required: true },
  images: [{ type: String }],
  // New fields
  disciplines: { type: disciplinesSchema, default: {} },
  training: { type: trainingSchema, default: {} },
  competitionCoaching: { type: competitionCoachingSchema, default: {} },
  diplomas: [{ type: String }]
}, {
  timestamps: true
});

// Avoid OverwriteModelError in Next.js (hot reload)
const Trainer = mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);

export default Trainer;
