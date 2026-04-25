const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    picture: { type: String, default: '' },
    wakeUpTime: { type: String, default: '05:00' },
    sleepTime: { type: String, default: '22:00' },
    courseStartTime: { type: String, default: '06:00' },
    courseEndTime: { type: String, default: '18:00' },
    arrivalTime: { type: String, default: '20:30' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
