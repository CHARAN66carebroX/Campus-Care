import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
    },
    domain: {
      type: String,
      // To auto-verify students, e.g., '@college.edu'
    },
    registrationKey: {
      type: String,
      // For College Admins to register
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.College || mongoose.model('College', CollegeSchema);
