import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    registrationKey: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    requiresStudentApproval: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const College = mongoose.model('College', collegeSchema);
