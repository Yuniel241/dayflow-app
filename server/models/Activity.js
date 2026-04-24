const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 5 }, // minutes
    priority: { type: Number, enum: [1, 2, 3], default: 2 }, // 1=high, 2=medium, 3=low
    category: {
      type: String,
      enum: ['études', 'loisirs', 'projet', 'routine', 'sport', 'autre'],
      default: 'autre',
    },
    type: { type: String, enum: ['fixe', 'flexible'], default: 'flexible' },
    color: { type: String, default: '#4ade80' },
    startTime: { type: String, default: null }, // HH:MM for fixed activities
    endTime: { type: String, default: null },
    days: [{ type: String, enum: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] }],
    deadline: { type: String, default: null }, // HH:MM constraint
    isActive: { type: Boolean, default: true },
    icon: { type: String, default: 'Pin' },
    emoji: { type: String, default: '📌' }, // legacy field kept for backward compatibility
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
