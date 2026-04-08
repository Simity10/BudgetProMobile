const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email ou numéro de téléphone requis' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Mot de passe de 6 caractères minimum requis' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Le nom est requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const query = email ? { email } : { phone };
    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ message: 'Ce compte existe déjà' });
    }

    const user = await User.create({ email, phone, password, name });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isPremium: user.isPremium,
      joinDate: user.joinDate,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    }

    // Chercher par email ou téléphone
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isPremium: user.isPremium,
      premiumExpiry: user.premiumExpiry,
      joinDate: user.joinDate,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    avatar: req.user.avatar,
    isPremium: req.user.isPremium,
    premiumExpiry: req.user.premiumExpiry,
    joinDate: req.user.joinDate
  });
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isPremium: user.isPremium,
      joinDate: user.joinDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
