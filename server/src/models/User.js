import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ['student', 'dept_admin', 'college_admin', 'platform_admin'],
      required: true,
    },
    city: { type: String, trim: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    profileComplete: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);


export const User = mongoose.model('User', userSchema);
