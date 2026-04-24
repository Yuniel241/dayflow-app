const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  activityName: String,
  category: String,
  color: String,
  icon: String,
  emoji: String,
  startTime: String, // HH:MM
  endTime: String,
  duration: Number,
  done: { type: Boolean, default: false },
  skipped: { type: Boolean, default: false },
  mlScore: Number,
  suggestedTime: String,
  needsOptimization: { type: Boolean, default: false },
  mlAdjusted: { type: Boolean, default: false },
});

const dayPlanSchema = new mongoose.Schema({
  date: String, // YYYY-MM-DD
  slots: [slotSchema],
  reflection: {
    bestWin: { type: String, default: '' },
    slowedDown: { type: String, default: '' },
    nextFocus: { type: String, default: '' },
  },
});

const planningSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true }, // YYYY-MM-DD (Monday)
    days: [dayPlanSchema],
    productivityScore: { type: Number, default: 0 },
    weeklyReflection: {
      bestWin: { type: String, default: '' },
      slowedDown: { type: String, default: '' },
      nextFocus: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

planningSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('Planning', planningSchema);
