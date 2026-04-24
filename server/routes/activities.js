const express = require('express');
const { protect } = require('../middleware/auth');
const Activity = require('../models/Activity');

const router = express.Router();
router.use(protect);

const normalizeDayKey = (day) => {
  if (!day || typeof day !== 'string') return null;
  const normalized = day
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const map = {
    lun: 'lun',
    lundi: 'lun',
    mar: 'mar',
    mardi: 'mar',
    mer: 'mer',
    mercredi: 'mer',
    jeu: 'jeu',
    jeudi: 'jeu',
    ven: 'ven',
    vendredi: 'ven',
    sam: 'sam',
    samedi: 'sam',
    dim: 'dim',
    dimanche: 'dim',
  };

  return map[normalized] || null;
};

const getDefaultIconForCategory = (category) => ({
  etudes: 'BookOpen',
  études: 'BookOpen',
  loisirs: 'Gamepad2',
  projet: 'Briefcase',
  routine: 'Sunrise',
  sport: 'Dumbbell',
  autre: 'Pin',
}[category] || 'Pin');

const sanitizeActivityPayload = (body) => {
  const payload = { ...body };
  const normalizedDays = (Array.isArray(payload.days) ? payload.days : [])
    .map(normalizeDayKey)
    .filter(Boolean);
  payload.days = [...new Set(normalizedDays)];

  if (!payload.icon || typeof payload.icon !== 'string') {
    payload.icon = getDefaultIconForCategory(payload.category);
  }

  return payload;
};

// GET all activities for user
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id, isActive: true }).sort({ priority: 1 });
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create activity
router.post('/', async (req, res) => {
  try {
    const payload = sanitizeActivityPayload(req.body);
    const activity = await Activity.create({ ...payload, userId: req.user._id });
    res.status(201).json({ success: true, activity });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  try {
    const payload = sanitizeActivityPayload(req.body);
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      payload,
      { new: true }
    );
    if (!activity) return res.status(404).json({ success: false, message: 'Activité introuvable' });
    res.json({ success: true, activity });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE activity (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false }
    );
    res.json({ success: true, message: 'Activité supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
