const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const chatRoutes = require('./routes/chat');
const templateRoutes = require('./routes/templates');
const kbRoutes = require('./routes/kb');
const documentRoutes = require('./routes/documents');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/documents', documentRoutes);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
