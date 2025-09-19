import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
