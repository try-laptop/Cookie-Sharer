const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://trylaptop2024:trylaptop2024@cookies.m2qyhmn.mongodb.net/?retryWrites=true&w=majority&appName=cookies";

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Cookie Schema
const cookieSchema = new mongoose.Schema({
  cookies: {
    type: String,
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Create model - we'll only have one document
const CookieStore = mongoose.model('CookieStore', cookieSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Cookie Sharing Server is running');
});

// Get cookie status
app.get('/api/status', async (req, res) => {
  try {
    const cookieStore = await CookieStore.findOne();
    if (!cookieStore) {
      return res.json({ isLoggedIn: false, lastUpdated: null });
    }
    
    // Check if cookies are expired
    const now = new Date();
    const isExpired = cookieStore.expiresAt < now;
    
    return res.json({
      isLoggedIn: isExpired ? false : cookieStore.isLoggedIn,
      lastUpdated: cookieStore.lastUpdated,
      expiresAt: cookieStore.expiresAt,
      isExpired: isExpired
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Get cookies
app.get('/api/cookies', async (req, res) => {
  try {
    const cookieStore = await CookieStore.findOne();
    if (!cookieStore) {
      return res.status(404).json({ error: 'No cookies found' });
    }
    
    // Check if cookies are expired
    const now = new Date();
    if (cookieStore.expiresAt < now) {
      return res.status(400).json({ error: 'Cookies have expired' });
    }
    
    return res.json({ cookies: cookieStore.cookies });
  } catch (error) {
    console.error('Error fetching cookies:', error);
    res.status(500).json({ error: 'Failed to fetch cookies' });
  }
});

// Save cookies
app.post('/api/cookies', async (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies) {
      return res.status(400).json({ error: 'Cookies data is required' });
    }
    
    // Calculate expiration (56 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 56);
    
    // Delete any existing cookies
    await CookieStore.deleteMany({});
    
    // Create new cookie store
    await CookieStore.create({
      cookies,
      isLoggedIn: true,
      lastUpdated: new Date(),
      expiresAt
    });
    
    res.status(200).json({ message: 'Cookies saved successfully' });
  } catch (error) {
    console.error('Error saving cookies:', error);
    res.status(500).json({ error: 'Failed to save cookies' });
  }
});

// Update logout status
app.post('/api/logout', async (req, res) => {
  try {
    const cookieStore = await CookieStore.findOne();
    if (!cookieStore) {
      return res.status(404).json({ error: 'No cookies found' });
    }
    
    cookieStore.isLoggedIn = false;
    cookieStore.lastUpdated = new Date();
    await cookieStore.save();
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error updating logout status:', error);
    res.status(500).json({ error: 'Failed to update logout status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
