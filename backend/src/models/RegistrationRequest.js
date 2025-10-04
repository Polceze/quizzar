import mongoose from 'mongoose';

const RegistrationRequestSchema = new mongoose.Schema({
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // We can add a unique compound index to prevent double requests
  // student and unit must be unique together
}, { timestamps: true });

// Create a unique index for student and unit combination
RegistrationRequestSchema.index({ student: 1, unit: 1 }, { unique: true });

const RegistrationRequest = mongoose.model('RegistrationRequest', RegistrationRequestSchema);
export default RegistrationRequest;