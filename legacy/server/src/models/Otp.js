import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ email: 1 });

export const Otp = mongoose.model('Otp', otpSchema);
