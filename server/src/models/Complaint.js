import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: String,
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    templateId: { type: String },
    submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    anonymous: { type: Boolean, default: false },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    category: { type: String, required: true },
    suggestedCategory: String,
    sentiment: {
      type: String,
      enum: ['calm', 'concerned', 'urgent', 'frustrated'],
      default: 'calm',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    stage: {
      type: String,
      enum: ['under_review', 'in_progress', 'resolved'],
      default: 'under_review',
    },
    attachments: [{ url: String, publicId: String }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [replySchema],
    resolvedAt: Date,
    escalationLevel: { type: Number, enum: [0, 1, 2], default: 0 },
    escalatedAt: Date,
    lastStaffActionAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

complaintSchema.index({ college: 1, department: 1, stage: 1 });
complaintSchema.index({ submitter: 1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
