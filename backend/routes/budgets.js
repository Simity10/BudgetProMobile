const express = require('express');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets — Récupérer les budgets
router.get('/', auth, async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.user._id });
    if (!budget) {
      budget = { monthlyBudget: 0, annualBudget: 0, categoryBudgets: {} };
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/budgets — Sauvegarder/mettre à jour les budgets
router.put('/', auth, async (req, res) => {
  try {
    const { monthlyBudget, annualBudget, categoryBudgets } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        monthlyBudget: monthlyBudget || 0,
        annualBudget: annualBudget || 0,
        categoryBudgets: categoryBudgets || {}
      },
      { upsert: true, new: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
