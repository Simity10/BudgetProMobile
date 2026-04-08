const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  annualBudget: {
    type: Number,
    default: 0
  },
  categoryBudgets: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
