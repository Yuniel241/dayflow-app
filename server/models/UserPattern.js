// C:\Users\axelm\Programmation\dayflow-app\server\models\UserPattern.js

const mongoose = require('mongoose');

const userPatternSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  productivityPatterns: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  preferredTimeSlots: {
    type: Map,
    of: Number,
    default: {}
  },
  activitySuccessRates: {
    type: Map,
    of: Number,
    default: {}
  },
  energyLevels: {
    type: Map,
    of: Number,
    default: {}
  },
  categoryPreferences: {
    type: Map,
    of: Number,
    default: {}
  },
  modelVersion: {
    type: Number,
    default: 1
  },
  lastTrainingAt: {
    type: Date,
    default: null
  },
  totalFeedbacks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userPatternSchema.index({ userId: 1 });
userPatternSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('UserPattern', userPatternSchema);