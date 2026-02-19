import mongoose from 'mongoose';

const CVSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  summary: String,
  experience: String,
  education: String,
  skills: String,
  template: { type: String, default: 'modern' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('CV', CVSchema);
