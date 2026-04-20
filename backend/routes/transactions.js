const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions — Récupérer toutes les transactions
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions — Ajouter une transaction
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date, localId } = req.body;

    if (!type || !amount || !category || !date || !localId) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount,
      category,
      description: description || '',
      date,
      localId
    });

    res.status(201).json(transaction);
  } catch (error) {
    // Doublon localId → ignorer silencieusement
    if (error.code === 11000) {
      return res.status(200).json({ message: 'Transaction déjà synchronisée' });
    }
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/transactions/:localId
router.delete('/:localId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      userId: req.user._id,
      localId: req.params.localId
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    res.json({ message: 'Transaction supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions/bulk — Sync en masse (pour la restauration)
router.post('/bulk', auth, async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: 'Format invalide' });
    }

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
    res.json({ message: `${transactions.length} transactions synchronisées` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
