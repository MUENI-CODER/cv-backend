import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
  res.json({ 
    message: 'Debug route works',
    routes: ['/health', '/api/cvs', '/debug']
  });
});

export default app;
