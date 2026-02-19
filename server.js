const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const user = new User({ name, email, password });
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// ========== CV ROUTES (Protected) ==========

// Function to generate unique share ID
function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// CV Schema with userId
const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

// Get all CVs for logged in user
app.get('/api/cvs', authMiddleware, async (req, res) => {
  try {
    const cvs = await CV.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CV by share ID (public - no auth needed)
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

// Create CV (protected)
app.post('/api/cvs', authMiddleware, async (req, res) => {
  try {
    const shareId = generateShareId();
    const cv = new CV({
      ...req.body,
      userId: req.user._id,
      shareId
    });
    await cv.save();
    res.status(201).json(cv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update CV (protected - verify ownership)
app.put('/api/cvs/:id', authMiddleware, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found or not authorized' });
    }
    
    const updated = await CV.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete CV (protected - verify ownership)
app.delete('/api/cvs/:id', authMiddleware, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cv) {
      return res.status(404).json({ error: 'CV not found or not authorized' });
    }
    
    await CV.findByIdAndDelete(req.params.id);
    res.json({ message: 'CV deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => {
  res.json({ 
    message: 'CV Backend API is running',
    endpoints: ['/health', '/api/cvs', '/api/cvs/share/:shareId', '/api/auth/register', '/api/auth/login']
  });
});

app.get('/health', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
