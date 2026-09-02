const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  theme: {
    type: String,
    default: 'violet'
  },
  notificationsEnabled: {
    type: Boolean,
    default: false
  },
  notificationHour: {
    type: Number,
    default: 9
  }
}, {
  timestamps: true
});

settingsSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema);
