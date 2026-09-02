const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise']
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: true
  },
  localId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, localId: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
