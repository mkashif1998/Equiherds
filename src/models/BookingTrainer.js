import mongoose from "mongoose";

// Schema for disciplines services
const disciplinesSchema = new mongoose.Schema({
  dressage: { type: Boolean, default: false },
  showJumping: { type: Boolean, default: false },
  eventing: { type: Boolean, default: false },
  endurance: { type: Boolean, default: false },
  western: { type: Boolean, default: false },
  vaulting: { type: Boolean, default: false }
}, { _id: false });

// Schema for training services
const trainingSchema = new mongoose.Schema({
  onLocationLessons: { type: Boolean, default: false },
  lessonsOnTrainersLocation: { type: Boolean, default: false }
}, { _id: false });

// Schema for competition coaching services
const competitionCoachingSchema = new mongoose.Schema({
  onLocationCoaching: { type: Boolean, default: false }
}, { _id: false });

// Schema for additional services
const additionalServicesSchema = new mongoose.Schema({
  disciplines: { type: disciplinesSchema, default: {} },
  training: { type: trainingSchema, default: {} },
  competitionCoaching: { type: competitionCoachingSchema, default: {} }
}, { _id: false, strict: false });

// Schema for service price details
const servicePriceDetailsSchema = new mongoose.Schema({
  disciplines: {
    dressage: { type: Boolean, default: false },
    dressagePrice: { type: Number, default: 0 },
    showJumping: { type: Boolean, default: false },
    showJumpingPrice: { type: Number, default: 0 },
    eventing: { type: Boolean, default: false },
    eventingPrice: { type: Number, default: 0 },
    endurance: { type: Boolean, default: false },
    endurancePrice: { type: Number, default: 0 },
    western: { type: Boolean, default: false },
    westernPrice: { type: Number, default: 0 },
    vaulting: { type: Boolean, default: false },
    vaultingPrice: { type: Number, default: 0 }
  },
  training: {
    onLocationLessons: { type: Boolean, default: false },
    onLocationLessonsPrice: { type: Number, default: 0 },
    lessonsOnTrainersLocation: { type: Boolean, default: false },
    lessonsOnTrainersLocationPrice: { type: Number, default: 0 }
  },
  competitionCoaching: {
    onLocationCoaching: { type: Boolean, default: false },
    onLocationCoachingPrice: { type: Number, default: 0 }
  }
}, { _id: false, strict: false });

const bookingTrainerSchema = new mongoose.Schema(
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
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
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
    ratinguserid: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
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

export default mongoose.models.BookingTrainer ||
  mongoose.model("BookingTrainer", bookingTrainerSchema);
