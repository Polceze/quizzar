import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required.'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Unit code is required.'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  questions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Question',
    default: [], 
    select: false,
  },
  // The teacher who created and manages this unit
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the main User model (who must be a teacher)
    required: true,
  },
  // Students currently enrolled in this unit
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the main User model (who must be a student)
  }],
}, { timestamps: true });

const Unit = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);
export default Unit;