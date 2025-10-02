import mongoose from "mongoose";

// Schema for short-term stay services
const shortTermStaySchema = new mongoose.Schema({
  selected: { type: String, default: null }
}, { _id: false });

// Schema for long-term stay services
const longTermStaySchema = new mongoose.Schema({
  selected: { type: String, default: null }
}, { _id: false });

// Schema for event pricing services
const eventPricingSchema = new mongoose.Schema({
  eventingCourse: { type: Boolean, default: false },
  canterTrack: { type: Boolean, default: false },
  jumpingTrack: { type: Boolean, default: false },
  dressageTrack: { type: Boolean, default: false }
}, { _id: false });

// Schema for additional services
const additionalServicesSchema = new mongoose.Schema({
  shortTermStay: { type: shortTermStaySchema, default: {} },
  longTermStay: { type: longTermStaySchema, default: {} },
  stallionsAccepted: { type: Boolean, default: false },
  eventPricing: { type: eventPricingSchema, default: {} }
}, { _id: false, strict: false }); // Add strict: false to allow additional fields

// Schema for service price details
const servicePriceDetailsSchema = new mongoose.Schema({
  shortTermStay: {
    selected: { type: String, default: null },
    price: { type: Number, default: 0 },
    pricePerDay: { type: Number, default: 0 }
  },
  longTermStay: {
    selected: { type: String, default: null },
    price: { type: Number, default: 0 },
    pricePerDay: { type: Number, default: 0 }
  },
  stallions: {
    selected: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    pricePerDay: { type: Number, default: 0 }
  },
  eventPricing: {
    eventingCourse: { type: Boolean, default: false },
    eventingCoursePrice: { type: Number, default: 0 },
    canterTrack: { type: Boolean, default: false },
    canterTrackPrice: { type: Number, default: 0 },
    jumpingTrack: { type: Boolean, default: false },
    jumpingTrackPrice: { type: Number, default: 0 },
    dressageTrack: { type: Boolean, default: false },
    dressageTrackPrice: { type: Number, default: 0 }
  }
}, { _id: false, strict: false }); // Add strict: false to allow additional fields

const bookingStablesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
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
    basePrice: {
      type: Number,
      required: true,
    },
    additionalServices: {
      type: additionalServicesSchema,
      default: {}
    },
    servicePriceDetails: {
      type: servicePriceDetailsSchema,
      default: {}
    },
    additionalServiceCosts: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 1,
    },
    // New field: ratinguserid (ObjectId, not required)
    ratinguserid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Legacy fields for backward compatibility
    price: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BookingStables ||
  mongoose.model("BookingStables", bookingStablesSchema);
