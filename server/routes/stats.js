const express = require('express');
const { protect } = require('../middleware/auth');
const Planning = require('../models/Planning');

const router = express.Router();
router.use(protect);

router.get('/overview', async (req, res) => {
  try {
    const plannings = await Planning.find({ userId: req.user._id }).sort({ weekStart: -1 }).limit(12);

    const weeklyStats = plannings.map((p) => {
      const allSlots = p.days.flatMap((d) => d.slots);
      const total = allSlots.length;
      const done = allSlots.filter((s) => s.done).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;

      // Best / worst day
      const dayStats = p.days.map((d) => ({
        date: d.date,
        total: d.slots.length,
        done: d.slots.filter((s) => s.done).length,
        rate: d.slots.length > 0 ? Math.round((d.slots.filter((s) => s.done).length / d.slots.length) * 100) : 0,
      }));

      const strongestDay = [...dayStats].sort((a, b) => b.rate - a.rate)[0];
      const needsFocusDay = [...dayStats].sort((a, b) => a.rate - b.rate)[0];

      return {
        weekStart: p.weekStart,
        total,
        done,
        rate,
        score: p.productivityScore,
        strongestDay,
        needsFocusDay,
        dayStats,
      };
    });

    // Category breakdown (all time)
    const allSlots = plannings.flatMap((p) => p.days.flatMap((d) => d.slots));
    const categoryStats = {};
    for (const slot of allSlots) {
      if (!categoryStats[slot.category]) categoryStats[slot.category] = { total: 0, done: 0 };
      categoryStats[slot.category].total++;
      if (slot.done) categoryStats[slot.category].done++;
    }

    res.json({ success: true, weeklyStats, categoryStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
