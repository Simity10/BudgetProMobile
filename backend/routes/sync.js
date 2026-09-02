const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/sync/backup — Sauvegarde complète depuis l'app
router.post('/backup', auth, async (req, res) => {
  try {
    const { transactions, budgets, settings } = req.body;

    // Sync des transactions
    if (Array.isArray(transactions) && transactions.length > 0) {
      const operations = transactions.map(t => ({
        updateOne: {
          filter: { userId: req.user._id, localId: t.localId },
          update: {
            $set: {
              userId: req.user._id,
              type: t.type,
              amount: t.amount,
              category: t.category,
              description: t.description || '',
              date: t.date,
              localId: t.localId
            }
          },
          upsert: true
        }
      }));
      await Transaction.bulkWrite(operations);
    }

    // Sync des budgets
    if (budgets) {
      await Budget.findOneAndUpdate(
        { userId: req.user._id },
        {
          userId: req.user._id,
          monthlyBudget: budgets.monthlyBudget || 0,
          annualBudget: budgets.annualBudget || 0,
          categoryBudgets: budgets.categoryBudgets || {}
        },
        { upsert: true }
      );
    }

    // Sync des paramètres
    if (settings) {
      await Settings.findOneAndUpdate(
        { userId: req.user._id },
        {
          userId: req.user._id,
          theme: settings.theme || 'violet',
          notificationsEnabled: settings.notificationsEnabled || false,
          notificationHour: settings.notificationHour || 9
        },
        { upsert: true }
      );
    }

    res.json({ message: 'Sauvegarde réussie' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sync/restore — Restauration complète vers l'app
router.get('/restore', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const budget = await Budget.findOne({ userId: req.user._id });
    const settings = await Settings.findOne({ userId: req.user._id });

    res.json({
      transactions: transactions || [],
      budgets: budget || { monthlyBudget: 0, annualBudget: 0, categoryBudgets: {} },
      settings: settings || { theme: 'violet', notificationsEnabled: false, notificationHour: 9 },
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        avatar: req.user.avatar,
        isPremium: req.user.isPremium,
        premiumExpiry: req.user.premiumExpiry,
        joinDate: req.user.joinDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
