// C:\Users\axelm\Programmation\dayflow-app\server\models/Feedback.js

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  activityName: {
    type: String
  },
  category: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    required: true
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5
  },
  actualDuration: {
    type: Number, // in minutes
    min: 0
  },
  predictedDuration: {
    type: Number
  },
  estimatedDuration: {
    type: Number
  },
  plannedStartTime: {
    type: String
  },
  timeOfDay: {
    type: String // hour when activity was planned
  },
  actualStartTime: {
    type: String // actual time when started
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

feedbackSchema.index({ userId: 1, date: -1 });
feedbackSchema.index({ activityId: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);