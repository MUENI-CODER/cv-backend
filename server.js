const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');

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

// Function to generate unique share ID
function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// CV Schema with shareId
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
  shareId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

const CV = mongoose.model('CV', cvSchema);

// ========== ROUTES ==========
app.get('/', (req, res) => {
  res.json({ message: 'CV Backend API is running', endpoints: ['/health', '/api/cvs', '/api/cvs/share/:shareId'] });
});

app.get('/health', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Get all CVs
app.get('/api/cvs', async (req, res) => {
  try {
    const cvs = await CV.find().sort({ createdAt: -1 });
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CV by share ID (public view)
app.get('/api/cvs/share/:shareId', async (req, res) => {
  try {
    const cv = await CV.findOne({ shareId: req.params.shareId });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }
    res.json(cv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create CV with share ID
app.post('/api/cvs', async (req, res) => {
  try {
    const shareId = generateShareId();
    const cv = new CV({
      ...req.body,
      shareId
    });
    await cv.save();
    res.status(201).json(cv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update CV
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

// Delete CV
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
