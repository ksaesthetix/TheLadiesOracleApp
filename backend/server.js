require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

const allowedOrigins = [
  'https://congenial-tribble-4rqj6wr7vwv27wqj-3000.app.github.dev',
  'https://theladiesoracleapp.onrender.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());

// Fixed MongoDB connection - remove quotes and add fallback
//const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:10000/theladiesoracle';
const MONGO_URI='mongodb+srv://Admin_theladiesoracle:MQA64yYiSn8PCpTT@theladiesoracle.yfjgelf.mongodb.net/TheLadiesOracle?retryWrites=true&w=majority&appName=TheLadiesOracle'

// Add debugging
console.log('MongoDB URI configured:', MONGO_URI ? 'Yes' : 'No');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully!'))
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
    name: { type: String },
    avatarUri: { type: String },
  }),
  'users'
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'The Ladies Oracle API is running', status: 'OK' });
});

// Get all quotes
app.get('/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Add a new quote
app.post('/quotes', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    
    const quote = new Quote({ text });
    await quote.save();
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// Get all questions
app.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get all icons
app.get('/icons', async (req, res) => {
  try {
    const icons = await Icon.find();
    res.json(icons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch icons' });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    
    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user by email
app.get('/user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      email: user.email, 
      name: user.name || '',
      avatarUri: user.avatarUri || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
app.post('/user/update', async (req, res) => {
  try {
    const { email, name, avatarUri } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Only update fields that are provided
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatarUri !== undefined) update.avatarUri = avatarUri;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      name: user.name || '',
      avatarUri: user.avatarUri || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 The Ladies Oracle API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});