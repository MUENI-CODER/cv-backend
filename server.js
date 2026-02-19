const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// CV Schema
const cvSchema = new mongoose.Schema({
  title: String,
  fullName: String,
  email: String,
  phone: String,
  summary: String,
  experience: String,
  education: String,
  skills: String,
  template: { type: String, default: 'modern' },
  createdAt: { type: Date, default: Date.now }
});

const CV = mongoose.model('CV', cvSchema);

// ========== ROUTES ==========
app.get('/', (req, res) => {
  res.json({ message: 'CV Backend API is running', endpoints: ['/health', '/api/cvs'] });
});

app.get('/health', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/cvs', async (req, res) => {
  try {
    const cvs = await CV.find().sort({ createdAt: -1 });
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cvs', async (req, res) => {
  try {
    const cv = new CV(req.body);
    await cv.save();
    res.status(201).json(cv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/cvs/:id', async (req, res) => {
  try {
    const cv = await CV.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(cv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/cvs/:id', async (req, res) => {
  try {
    await CV.findByIdAndDelete(req.params.id);
    res.json({ message: 'CV deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
