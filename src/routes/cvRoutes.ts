import express from 'express';

const router = express.Router();

// Get all CVs
router.get('/', (req, res) => {
  res.json({ message: 'CV API is working!', cvs: [] });
});

// Create a CV
router.post('/', (req, res) => {
  res.json({ message: 'CV created!', data: req.body });
});

export default router;
