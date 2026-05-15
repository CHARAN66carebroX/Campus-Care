import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      // e.g., 'WiFi', 'Hostel', 'Transport', 'Academics', 'Infrastructure', 'Other'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Escalated'],
      default: 'Pending',
    },
    sentiment: {
      type: String,
      enum: ['calm', 'concerned', 'urgent', 'frustrated', 'unknown'],
      default: 'unknown',
    },
    attachments: [
      {
        url: String,
        public_id: String, // from Cloudinary
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Optional if anonymous, but usually we link it internally and hide on UI
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    escalationLevel: {
      type: Number,
      default: 0, // 0 = Dept, 1 = College Admin, 2 = Super Admin
    },
  },
  { timestamps: true }
);

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
