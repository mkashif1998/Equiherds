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

const stableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  Tittle: { type: String, required: true },
  Deatils: { type: String, required: true },
  image: [{ type: String }],
  Rating: { type: Number, required: false },
  PriceRate: [priceRateSchema],
  Slotes: [slotSchema]
}, {
  timestamps: true
});

const Stable = mongoose.models.Stable || mongoose.model("Stable", stableSchema);

export default Stable;
