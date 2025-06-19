import mongoose from 'mongoose';

const therapistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  availability: [{
    day: String, // e.g., 'Monday'
    start: String, // e.g., '09:00'
    end: String   // e.g., '17:00'
  }],
  bio: { type: String },
  experience: { type: Number }, // years of experience
  // Add more optional fields as needed
}, { timestamps: true });

const Therapist = mongoose.model('Therapist', therapistSchema);
export default Therapist; 