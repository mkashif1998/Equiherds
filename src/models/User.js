import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: false },
  subscriptionStatus: { type: String, required:  false },
  subscriptionExpiry: { type: String, required:  false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  accountType: { 
    type: String, 
    required: true,
    enum: ['buyer', 'seller', 'superAdmin']
  },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  companyName: { type: String },
  brandImage: { type: String }, 
  companyInfo: { type: String },
  Details: { type: String, required:  false },
  profilePicture: { type: String, required:  false },
  status: { type: String, required: true },
  payments: { type: [paymentSchema], default: [] } // Add payments array of JSON objects
}, {
  timestamps: true 
});

// Remove password from JSON outputs
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret && ret.password) {
      delete ret.password;
    }
    return ret;
  }
});

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Hash password on findOneAndUpdate if provided
userSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (update && update.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
      this.setUpdate(update);
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
