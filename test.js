import express from 'express';
const app = express();
const port = 5001;

app.get('/health', (req, res) => {
  res.json({ message: 'OK' });
});

app.get('/api/cvs', (req, res) => {
  res.json({ cvs: [] });
});

app.listen(port, () => {
  console.log(Server running on port );
});
