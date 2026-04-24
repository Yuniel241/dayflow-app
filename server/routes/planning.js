const express = require('express');
const { protect } = require('../middleware/auth');
const Planning = require('../models/Planning');
const Activity = require('../models/Activity');
const { generateWeekPlanning } = require('../services/planningService');
const mlPlanningService = require('../services/mlPlanningService');  // ← AJOUTER
const feedbackService = require('../services/feedbackService');      // ← AJOUTER
const mlApiService = require('../services/mlApiService');

const router = express.Router();
router.use(protect);

function buildDoneIndex(existingPlanning) {
  const byDateAndActivity = new Map();
  if (!existingPlanning?.days) return byDateAndActivity;

  for (const day of existingPlanning.days) {
    const date = day.date;
    for (const slot of day.slots || []) {
      if (!slot?.done) continue;
      const activityId = slot.activityId?.toString?.() || slot.activityId || null;
      if (!activityId) continue;
      const key = `${date}::${activityId}`;
      byDateAndActivity.set(key, true);
    }
  }

  return byDateAndActivity;
}

function applyDoneIndex(planningDays, doneIndex) {
  if (!Array.isArray(planningDays) || !doneIndex) return planningDays;

  for (const day of planningDays) {
    for (const slot of day.slots || []) {
      const activityId = slot.activityId?.toString?.() || slot.activityId || null;
      if (!activityId) continue;
      const key = `${day.date}::${activityId}`;
      if (doneIndex.get(key) === true) slot.done = true;
    }
  }

  return planningDays;
}

function computeProductivityScore(days) {
  const allSlots = (days || []).flatMap((d) => d.slots || []);
  const total = allSlots.length;
  const done = allSlots.filter((s) => s.done).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

async function buildPlanningDays(user, activities, weekStart) {
  const mlApiResult = await mlApiService.generatePlanning({
    user,
    userId: user._id,
    activities,
    weekStart,
  });

  if (mlApiResult.success) {
    return {
      days: mlApiResult.planning,
      engine: mlApiResult.mlActive ? 'ml-api-trained' : 'ml-api-heuristic',
      warning: null,
    };
  }

  let days = generateWeekPlanning(user, activities, weekStart);
  const patterns = await mlPlanningService.getUserPatterns(user._id);
  if (patterns.totalFeedbacks >= 10) {
    days = mlPlanningService.enhancePlanningWithML(days, activities, patterns);
  }

  return {
    days,
    engine: 'local-fallback',
    warning: `ML API non disponible (${mlApiResult.error || 'erreur inconnue'}). Fallback local utilise.`,
  };
}

// GET planning for a week (MODIFIÉ - avec enhancement ML)
router.get('/week/:weekStart', async (req, res) => {
  try {
    let planning = await Planning.findOne({ userId: req.user._id, weekStart: req.params.weekStart });
    let plannerEngine = 'cached';
    let plannerWarning = null;
    
    if (!planning) {
      const activities = await Activity.find({ userId: req.user._id, isActive: true });
      const result = await buildPlanningDays(req.user, activities, req.params.weekStart);
      plannerEngine = result.engine;
      plannerWarning = result.warning;
      
      planning = await Planning.create({
        userId: req.user._id,
        weekStart: req.params.weekStart,
        days: result.days,
        productivityScore: computeProductivityScore(result.days),
      });
    }
    
    res.json({ success: true, planning, plannerEngine, plannerWarning });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST regenerate planning (MODIFIÉ - avec enhancement ML)
router.post('/generate/:weekStart', async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id, isActive: true });
    const result = await buildPlanningDays(req.user, activities, req.params.weekStart);

    const existing = await Planning.findOne({ userId: req.user._id, weekStart: req.params.weekStart });
    const doneIndex = buildDoneIndex(existing);
    applyDoneIndex(result.days, doneIndex);
    const productivityScore = computeProductivityScore(result.days);

    const planning = await Planning.findOneAndUpdate(
      { userId: req.user._id, weekStart: req.params.weekStart },
      { days: result.days, productivityScore },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      planning,
      plannerEngine: result.engine,
      plannerWarning: result.warning,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH mark slot as done/undone (MODIFIÉ - avec collecte feedback)
router.patch('/:weekStart/:date/slot/:slotIndex', async (req, res) => {
  try {
    const planning = await Planning.findOne({ userId: req.user._id, weekStart: req.params.weekStart });
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    const day = planning.days.find((d) => d.date === req.params.date);
    if (!day) return res.status(404).json({ success: false, message: 'Jour introuvable' });

    const slot = day.slots[parseInt(req.params.slotIndex)];
    if (!slot) return res.status(404).json({ success: false, message: 'Créneau introuvable' });

    const newDoneState = req.body.done !== undefined ? req.body.done : !slot.done;
    let feedbackWarning = null;
    
    // ← NOUVEAU: Collecter du feedback pour le ML
    if (newDoneState === true && slot.done === false) {
      // Tâche complétée
      try {
        await feedbackService.collectFromSlot(
          req.user._id,
          slot,
          req.params.date,
          true,
          slot.duration
        );
      } catch (error) {
        console.error('Feedback auto (done=true) non sauvegarde:', error);
        feedbackWarning = 'Le statut a ete mis a jour, mais le feedback ML n a pas pu etre enregistre.';
      }
    } else if (newDoneState === false && slot.done === true) {
      // Tâche décochée (optionnel)
      try {
        await feedbackService.collectFromSlot(
          req.user._id,
          slot,
          req.params.date,
          false,
          slot.duration
        );
      } catch (error) {
        console.error('Feedback auto (done=false) non sauvegarde:', error);
        feedbackWarning = 'Le statut a ete mis a jour, mais le feedback ML n a pas pu etre enregistre.';
      }
    }
    
    slot.done = newDoneState;

    // Recalculate productivity score
    const allSlots = planning.days.flatMap((d) => d.slots);
    const total = allSlots.length;
    const done = allSlots.filter((s) => s.done).length;
    planning.productivityScore = total > 0 ? Math.round((done / total) * 100) : 0;

    await planning.save();
    res.json({ success: true, planning, feedbackWarning });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ← NOUVEAU ROUTE: Feedback détaillé avec satisfaction
router.post('/feedback/:weekStart/:date/slot/:slotIndex', async (req, res) => {
  try {
    const { satisfactionScore, actualDuration, notes } = req.body;
    
    const planning = await Planning.findOne({ userId: req.user._id, weekStart: req.params.weekStart });
    if (!planning) return res.status(404).json({ success: false });
    
    const day = planning.days.find((d) => d.date === req.params.date);
    const slot = day?.slots[parseInt(req.params.slotIndex)];
    if (!slot) return res.status(404).json({ success: false });
    
    const result = await feedbackService.collectDetailedFeedback(req.user._id, {
      activityId: slot.activityId,
      activityName: slot.activityName,
      category: slot.category,
      date: req.params.date,
      completed: slot.done,
      satisfactionScore,
      actualDuration,
      plannedStartTime: slot.startTime,
      estimatedDuration: slot.duration,
      notes
    });
    
    res.json({ success: true, feedback: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ← NOUVEAU ROUTE: Statistiques ML
router.get('/ml-stats', async (req, res) => {
  try {
    const stats = await mlPlanningService.getMLStats(req.user._id);
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/ml-engine-status', async (req, res) => {
  try {
    const probe = await mlApiService.generatePlanning({
      user: req.user,
      userId: req.user._id,
      activities: [],
      weekStart: new Date().toISOString().slice(0, 10),
    });

    if (probe.success) {
      return res.json({
        success: true,
        engine: probe.mlActive ? 'ml-api-trained' : 'ml-api-heuristic',
        connected: true,
      });
    }

    return res.json({
      success: true,
      engine: 'local-fallback',
      connected: false,
      warning: probe.error || 'ML API indisponible',
    });
  } catch (err) {
    return res.status(500).json({ success: false, connected: false, message: err.message });
  }
});

// PATCH weekly reflection (INCHANGÉ)
router.patch('/:weekStart/reflection', async (req, res) => {
  try {
    const planning = await Planning.findOneAndUpdate(
      { userId: req.user._id, weekStart: req.params.weekStart },
      { weeklyReflection: req.body },
      { new: true }
    );
    res.json({ success: true, planning });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;