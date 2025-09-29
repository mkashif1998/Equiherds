import mongoose from "mongoose";

const bookingStablesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stable",
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    bookingType: {
      type: String,
      required: true,
      enum: ["day", "week"], // You can adjust enum values as needed
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    numberOfHorses: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BookingStables ||
  mongoose.model("BookingStables", bookingStablesSchema);
