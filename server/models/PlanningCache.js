const mongoose = require('mongoose');

const planningCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStart: {
    type: String, // YYYY-MM-DD
    required: true
  },
  planning: {
    type: [{
      date: String,
      slots: [{
        activityId: mongoose.Schema.Types.ObjectId,
        activityName: String,
        category: String,
        color: String,
        emoji: String,
        startTime: String,
        endTime: String,
        duration: Number,
        done: Boolean,
        mlScore: Number
      }]
    }],
    required: true
  },
  source: {
    type: String,
    enum: ['ml', 'heuristic', 'hybrid'],
    default: 'heuristic'
  },
  mlConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  statistics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

planningCacheSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
planningCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PlanningCache', planningCacheSchema);