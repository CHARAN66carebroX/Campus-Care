import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

departmentSchema.index({ college: 1, name: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);
