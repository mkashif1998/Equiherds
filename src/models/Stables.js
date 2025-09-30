import mongoose from "mongoose";

const priceRateSchema = new mongoose.Schema({
  PriceRate: { type: Number, required: true },
  RateType: { type: String, required: true }
}, { _id: false });

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const coordinatesSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });
const stableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  Tittle: { type: String, required: true },
  Deatils: { type: String, required: true },
  image: [{ type: String }],
  Rating: { type: Number, required: false },
  location: { type: String, required: true },
  coordinates: { type: coordinatesSchema, required: true },
  noofRatingCustomers: { type: Number, required: false },
  PriceRate: [priceRateSchema],
  Slotes: [slotSchema],
  status: { type: String, required: true, default: "active" }
}, {
  timestamps: true
});

const Stable = mongoose.models.Stable || mongoose.model("Stable", stableSchema);

export default Stable;
