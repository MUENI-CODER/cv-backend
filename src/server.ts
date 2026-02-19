import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ===== ALL ROUTES DIRECTLY HERE =====
app.get('/health', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/cvs', (req, res) => {
  res.json({ message: 'CV API is working!', cvs: [] });
});

app.post('/api/cvs', (req, res) => {
  res.json({ message: 'CV created!', data: req.body });
});

app.get('/debug', (req, res) => {
  res.json({ message: 'Debug route works' });
});
// ====================================

// Start server
app.listen(PORT, () => {
  console.log(🚀 Server running on http://localhost:);
});
