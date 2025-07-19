const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your actual MongoDB connection string:
const MONGO_URI = 'mongodb+srv://Admin_theladiesoracle:MQA64yYiSn8PCpTT@theladiesoracle.yfjgelf.mongodb.net/TheLadiesOracle?retryWrites=true&w=majority&appName=TheLadiesOracle';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Quote schema/model
const Quote = mongoose.model('Quote', { text: String });

// Question schema/model
const Question = mongoose.model('Question', new mongoose.Schema({}, { strict: false }), 'questions');
// Icon schema/model
const Icon = mongoose.model('Icon', new mongoose.Schema({}, { strict: false }), 'icons');
// User schema/model
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },           // <-- add this
    avatarUri: { type: String },      // <-- and this
  }),
  'users'
);

// Add this to your server.js for a quick check
app.get('/', (req, res) => {
  res.send('API is running');
});

// Get all quotes
app.get('/quotes', async (req, res) => {
  const quotes = await Quote.find();
  res.json(quotes);
});

// Add a new quote
app.post('/quotes', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const quote = new Quote({ text });
  await quote.save();
  res.json(quote);
});

// Get all questions
app.get('/questions', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

// Get all icons
app.get('/icons', async (req, res) => {
  const icons = await Icon.find();
  res.json(icons);
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();
  res.json({ message: 'User created' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ message: 'Login successful' });
});

// Get user by email
app.get('/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ email: user.email, name: user.name || '' });
});

// Update user profile (name, avatarUri, etc.)
app.post('/user/update', async (req, res) => {
  const { email, name, avatarUri } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Only update fields that are provided
  const update = {};
  if (name !== undefined) update.name = name;
  if (avatarUri !== undefined) update.avatarUri = avatarUri;

  const user = await User.findOneAndUpdate(
    { email },
    { $set: update },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    email: user.email,
    name: user.name || '',
    avatarUri: user.avatarUri || ''
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));