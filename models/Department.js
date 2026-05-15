import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
