/**
 * PlanningService v2 — Algorithme intelligent
 *
 * Principes :
 * 1. Créneaux fixes bloqués (sommeil, routine, cours, transport)
 * 2. Créneaux libres calculés
 * 3. Score d'énergie par créneau horaire (matin = haute énergie)
 * 4. Score de compatibilité activité x créneau (énergie + priorité + durée)
 * 5. Placement glouton : toujours le meilleur match en premier
 * 6. Évite de tout planifier le même jour (distribution équilibrée)
 * 7. Respecte les deadlines et jours ciblés par l'activité
 */

const timeToMin = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const minToTime = (min) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeDayKey = (day) => {
  if (!day || typeof day !== 'string') return null;
  const normalized = day
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const dayMap = {
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

  return dayMap[normalized] || null;
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

// Score d'energie selon l'heure (0-10)
// L'algo prefere placer les taches importantes dans les pics d'energie
const energyScore = (startMin, category) => {
  const h = startMin / 60;

  // Reveil / matin tot (5h-8h) : bonne energie, ideal routine + sport
  if (h >= 5 && h < 8) {
    if (['routine', 'sport'].includes(category)) return 9;
    return 7;
  }
  // Matin (8h-12h) : pic cognitif -> etudes, projets
  if (h >= 8 && h < 12) {
    if (['etudes', 'études', 'projet'].includes(category)) return 10;
    return 8;
  }
  // Apres-midi (12h-18h) : generalement cours
  if (h >= 12 && h < 18) return 5;

  // Soiree tot (20h-21h30) : bonne recuperation -> projets, loisirs
  if (h >= 20 && h < 21.5) {
    if (['projet', 'loisirs'].includes(category)) return 8;
    return 7;
  }
  // Soiree tardive (21h30-22h) : fatigue -> taches legeres seulement
  if (h >= 21.5 && h < 22) {
    if (['loisirs', 'lecture'].includes(category)) return 5;
    return 3;
  }

  return 2;
};

// Score global d'un placement activite dans un creneau
const placementScore = (activity, slotStart, slotDuration) => {
  if (slotDuration < activity.duration) return -1;

  const energy = energyScore(slotStart, activity.category);
  const priorityBoost = (4 - activity.priority) * 2; // priorite 1 -> +6, 3 -> +2

  // Penalite si le creneau est beaucoup plus grand que necessaire
  const wasteRatio = slotDuration / activity.duration;
  const wastePenalty = wasteRatio > 3 ? 2 : 0;

  return energy + priorityBoost - wastePenalty;
};

// Creneaux fixes selon le profil utilisateur
const getFixedBlocks = (user, isWeekend) => {
  const wakeMin = timeToMin(user.wakeUpTime || '05:00');
  const sleepMin = timeToMin(user.sleepTime || '22:00');
  const courseEndMin = timeToMin(user.courseEndTime || '18:00');
  const arrivalMin = timeToMin(user.arrivalTime || '20:30');

  const blocks = [
    { start: 0, end: wakeMin, label: 'Sommeil' },
    { start: wakeMin, end: wakeMin + 30, label: 'Routine matinale' },
    { start: sleepMin, end: 24 * 60, label: 'Sommeil' },
  ];

  if (!isWeekend) {
    const departMin = wakeMin + 60;
    blocks.push({ start: departMin, end: courseEndMin, label: 'Cours + transport' });
    blocks.push({ start: courseEndMin, end: arrivalMin, label: 'Transport retour' });
  }

  return blocks;
};

// Creneaux libres a partir des blocs fixes
const computeFreeSlots = (fixedBlocks) => {
  const sorted = [...fixedBlocks].sort((a, b) => a.start - b.start);
  const merged = [];

  for (const b of sorted) {
    if (merged.length === 0 || b.start > merged[merged.length - 1].end) {
      merged.push({ ...b });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
    }
  }

  const free = [];
  let cursor = 0;
  for (const block of merged) {
    if (block.start > cursor) free.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < 24 * 60) free.push({ start: cursor, end: 24 * 60 });

  return free.filter((s) => s.end - s.start >= 20);
};

// Distribution equilibree : budget de minutes flex par jour
const computeDayBudgets = (allDays, totalFlexMins) => {
  const totalFree = allDays.reduce((sum, d) => sum + d.totalFreeMin, 0);
  return allDays.map((d) => ({
    ...d,
    budget: totalFree > 0 ? Math.ceil((d.totalFreeMin / totalFree) * totalFlexMins * 1.1) : 0,
  }));
};

// GENERATEUR PRINCIPAL
const generateWeekPlanning = (user, activities, weekStart) => {
  const dayNames = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  const weekStartDate = new Date(weekStart + 'T00:00:00');

  // Pre-calcul : creneaux libres par jour
  const dayContexts = dayNames.map((dayName, i) => {
    const isWeekend = ['sam', 'dim'].includes(dayName);
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    const dateStr = toLocalISODate(date);

    const fixedBlocks = getFixedBlocks(user, isWeekend);
    const freeSlots = computeFreeSlots(fixedBlocks);
    const totalFreeMin = freeSlots.reduce((s, sl) => s + (sl.end - sl.start), 0);

    return { dayName, date: dateStr, isWeekend, freeSlots, totalFreeMin, usedMin: 0, plannedSlots: [] };
  });

  // Slot de routine matinale (fixe, tous les jours)
  const wakeMin = timeToMin(user.wakeUpTime || '05:00');
  for (const ctx of dayContexts) {
    ctx.plannedSlots.push({
      activityName: 'Routine matinale',
      category: 'routine',
      color: '#a3e635',
      icon: 'Sunrise',
      startTime: minToTime(wakeMin),
      endTime: minToTime(wakeMin + 30),
      duration: 30,
      done: false,
    });
  }

  // Separer activites fixes vs flexibles
  const fixedActivities = activities.filter((a) => a.type === 'fixe');
  const flexActivities = activities
    .filter((a) => a.type !== 'fixe' && a.isActive !== false)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.duration - a.duration;
    });

  // Placer les activites fixes
  for (const act of fixedActivities) {
    const normalizedDays = (act.days || []).map(normalizeDayKey).filter(Boolean);
    for (const ctx of dayContexts) {
      if (normalizedDays.length > 0 && !normalizedDays.includes(ctx.dayName)) continue;
      if (!act.startTime || !act.endTime) continue;
      ctx.plannedSlots.push({
        activityId: act._id,
        activityName: act.name,
        category: act.category,
        color: act.color,
        icon: act.icon || getDefaultIconForCategory(act.category),
        startTime: act.startTime,
        endTime: act.endTime,
        duration: act.duration,
        done: false,
      });
    }
  }

  // Budget de minutes flexibles a distribuer
  const totalFlexMins = flexActivities.reduce((s, a) => s + a.duration, 0);
  const dayBudgets = computeDayBudgets(dayContexts, totalFlexMins);

  // Placement intelligent : pour chaque activite, trouver le MEILLEUR slot semaine
  for (const act of flexActivities) {
    const normalizedDays = (act.days || []).map(normalizeDayKey).filter(Boolean);
    let bestScore = -Infinity;
    let bestCtxIdx = -1;
    let bestSlotIdx = -1;
    let bestStart = -1;

    for (let ci = 0; ci < dayBudgets.length; ci++) {
      const ctx = dayBudgets[ci];

      if (normalizedDays.length > 0 && !normalizedDays.includes(ctx.dayName)) continue;
      if (ctx.usedMin >= ctx.budget) continue;

      for (let si = 0; si < ctx.freeSlots.length; si++) {
        const slot = ctx.freeSlots[si];
        const slotDur = slot.end - slot.start;

        if (slotDur < act.duration) continue;

        if (act.deadline) {
          const deadlineMin = timeToMin(act.deadline);
          if (slot.start + act.duration > deadlineMin) continue;
        }

        const score = placementScore(act, slot.start, slotDur);
        if (score > bestScore) {
          bestScore = score;
          bestCtxIdx = ci;
          bestSlotIdx = si;
          bestStart = slot.start;
        }
      }
    }

    if (bestCtxIdx === -1) continue;

    const ctx = dayBudgets[bestCtxIdx];
    const slot = ctx.freeSlots[bestSlotIdx];
    const actEnd = bestStart + act.duration;

    ctx.plannedSlots.push({
      activityId: act._id,
      activityName: act.name,
      category: act.category,
      color: act.color,
      icon: act.icon || getDefaultIconForCategory(act.category),
      startTime: minToTime(bestStart),
      endTime: minToTime(actEnd),
      duration: act.duration,
      done: false,
    });

    ctx.usedMin += act.duration;

    const remaining = slot.end - actEnd;
    if (remaining >= 20) {
      slot.start = actEnd;
    } else {
      ctx.freeSlots.splice(bestSlotIdx, 1);
    }
  }

  // Trier les slots de chaque jour par heure de debut
  for (const ctx of dayBudgets) {
    ctx.plannedSlots.sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  }

  return dayBudgets.map((ctx) => ({
    date: ctx.date,
    slots: ctx.plannedSlots,
  }));
};

module.exports = { generateWeekPlanning };