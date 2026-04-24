const UserPattern = require('../models/UserPattern');
const Feedback = require('../models/Feedback');
const mlApiService = require('./mlApiService');

class MLPlanningService {
  toMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  toHHMM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  getHourFromFeedback(feedbackData) {
    if (feedbackData?.plannedStartTime) {
      const hour = parseInt(feedbackData.plannedStartTime.split(':')[0], 10);
      if (!Number.isNaN(hour)) return hour;
    }
    const date = new Date(feedbackData.date);
    return Number.isNaN(date.getTime()) ? null : date.getHours();
  }

  canMoveSlot(daySlots, currentSlot, newStartMinutes, durationMinutes) {
    const newEndMinutes = newStartMinutes + durationMinutes;
    if (newStartMinutes < 0 || newEndMinutes > 24 * 60) return false;

    return daySlots.every((slot) => {
      if (slot === currentSlot) return true;
      const start = this.toMinutes(slot.startTime);
      const end = this.toMinutes(slot.endTime);
      if (start === null || end === null) return true;
      return newEndMinutes <= start || newStartMinutes >= end;
    });
  }
  
  // Récupère ou crée les patterns d'un utilisateur
  async getUserPatterns(userId) {
    let patterns = await UserPattern.findOne({ userId });
    if (!patterns) {
      patterns = await UserPattern.create({
        userId,
        productivityPatterns: {},
        preferredTimeSlots: {},
        activitySuccessRates: {},
        energyLevels: {},
        categoryPreferences: {}
      });
    }
    return patterns;
  }

  // Calcule un score intelligent pour placer une activité
  calculateSmartScore(activity, hour, dayOfWeek, userPatterns) {
    let score = 0;
    
    // 1. Score d'énergie selon l'heure (0-10)
    let energyScore = 5; // default
    if (hour >= 5 && hour < 8) energyScore = 7;
    else if (hour >= 8 && hour < 12) energyScore = 9;
    else if (hour >= 12 && hour < 18) energyScore = 6;
    else if (hour >= 18 && hour < 21) energyScore = 7;
    else if (hour >= 21 && hour < 23) energyScore = 4;
    else if (hour >= 23 || hour < 5) energyScore = 2;
    
    // Ajustement selon les patterns utilisateur
    if (userPatterns?.energyLevels) {
      const hourKey = `${Math.floor(hour)}:00`;
      const userEnergy = userPatterns.energyLevels.get(hourKey) || 0.5;
      energyScore = energyScore * (0.7 + userEnergy * 0.6);
    }
    
    // 2. Bonus par catégorie
    const categoryBonus = {
      'études': 2,
      'projet': 2, 
      'routine': 1,
      'sport': 1,
      'loisirs': 0
    }[activity.category] || 0;
    
    // 3. Bonus de priorité (1 = haute priorité)
    const priorityBonus = (4 - activity.priority) * 1.5;
    
    // 4. Pattern de succès par catégorie
    let successFactor = 1.0;
    if (userPatterns?.activitySuccessRates) {
      const successRate = userPatterns.activitySuccessRates.get(activity.category) || 0.5;
      successFactor = 0.8 + successRate * 0.4;
    }
    
    score = (energyScore + categoryBonus + priorityBonus) * successFactor;
    return Math.min(12, Math.max(0, score));
  }

  // Améliore le planning généré avec des ajustements ML
  enhancePlanningWithML(planningDays, activities, userPatterns) {
    const enhancedDays = JSON.parse(JSON.stringify(planningDays));
    
    for (const day of enhancedDays) {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      // Pour chaque slot flexible, on ajuste si nécessaire
      for (const slot of day.slots) {
        // Ne pas toucher aux routines fixes
        if (slot.activityName === 'Routine matinale') continue;
        
        const activity = activities.find(a => a._id.toString() === slot.activityId?.toString());
        if (!activity || activity.type === 'fixe') continue;
        
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const currentScore = this.calculateSmartScore(activity, startHour, dayOfWeek, userPatterns);
        
        // Ajouter un champ ML score pour référence
        slot.mlScore = Math.round(currentScore * 10);
        
        // Si le score est très bas (< 30), suggérer un meilleur horaire
        if (currentScore < 3) {
          let bestHour = startHour;
          let bestScore = currentScore;
          
          for (let hour = 8; hour <= 21; hour++) {
            const testScore = this.calculateSmartScore(activity, hour, dayOfWeek, userPatterns);
            if (testScore > bestScore) {
              bestScore = testScore;
              bestHour = hour;
            }
          }
          
          if (bestScore > currentScore + 1.5) {
            const optimizedStart = bestHour * 60;
            const canApply = this.canMoveSlot(day.slots, slot, optimizedStart, slot.duration || activity.duration || 0);
            slot.suggestedTime = `${bestHour.toString().padStart(2, '0')}:00`;
            slot.needsOptimization = !canApply;

            if (canApply) {
              const startMinutes = optimizedStart;
              const endMinutes = startMinutes + (slot.duration || activity.duration || 0);
              slot.startTime = this.toHHMM(startMinutes);
              slot.endTime = this.toHHMM(endMinutes);
              slot.mlAdjusted = true;
            }
          }
        }
      }

      day.slots.sort((a, b) => {
        const aMin = this.toMinutes(a.startTime) ?? 0;
        const bMin = this.toMinutes(b.startTime) ?? 0;
        return aMin - bMin;
      });
    }
    
    return enhancedDays;
  }

  // Enregistre un feedback utilisateur pour l'apprentissage
  async saveFeedback(userId, feedbackData) {
    try {
      // Sauvegarder le feedback
      const feedback = await Feedback.create({
        userId,
        ...feedbackData,
        date: new Date(feedbackData.date)
      });
      
      // Mettre à jour les patterns
      const patterns = await this.getUserPatterns(userId);
      
      // Mettre à jour le taux de succès par catégorie
      const currentRate = patterns.activitySuccessRates.get(feedbackData.category) || 0.5;
      const newRate = currentRate * 0.9 + (feedbackData.completed ? 0.1 : 0);
      patterns.activitySuccessRates.set(feedbackData.category, newRate);
      
      // Mettre à jour les créneaux horaires préférés
      if (feedbackData.completed && feedbackData.satisfactionScore >= 4) {
        const hour = this.getHourFromFeedback(feedbackData);
        if (hour !== null) {
          const hourKey = `${hour}:00`;
          const currentPref = patterns.preferredTimeSlots.get(hourKey) || 0.5;
          patterns.preferredTimeSlots.set(hourKey, Math.min(1, currentPref + 0.05));
        }
      }
      
      // Mettre à jour l'énergie perçue
      if (feedbackData.actualDuration && feedbackData.plannedStartTime) {
        const plannedHour = parseInt(feedbackData.plannedStartTime.split(':')[0]);
        const hourKey = `${plannedHour}:00`;
        
        // Si l'activité a pris moins de temps que prévu = bonne énergie
        const efficiency = feedbackData.actualDuration / (feedbackData.estimatedDuration || 60);
        const currentEnergy = patterns.energyLevels.get(hourKey) || 0.5;
        const newEnergy = currentEnergy * 0.95 + (efficiency < 1.1 ? 0.05 : -0.03);
        patterns.energyLevels.set(hourKey, Math.max(0, Math.min(1, newEnergy)));
      }
      
      patterns.totalFeedbacks += 1;
      patterns.lastTrainingAt = new Date();
      await patterns.save();

      // Sync vers l'API ML Python si disponible.
      await mlApiService.submitFeedback({
        userId,
        activityId: feedbackData.activityId,
        date: feedbackData.date,
        completed: feedbackData.completed,
        satisfactionScore: feedbackData.satisfactionScore,
        actualDuration: feedbackData.actualDuration,
      });
      
      return { success: true, totalFeedbacks: patterns.totalFeedbacks };
    } catch (error) {
      console.error('Erreur sauvegarde feedback:', error);
      throw error;
    }
  }

  // Récupère les statistiques ML d'un utilisateur
  async getMLStats(userId) {
    const patterns = await this.getUserPatterns(userId);
    const recentFeedbacks = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const completionRate = recentFeedbacks.length > 0 
      ? recentFeedbacks.filter(f => f.completed).length / recentFeedbacks.length 
      : 0;
    
    const avgSatisfaction = recentFeedbacks.length > 0
      ? recentFeedbacks.reduce((sum, f) => sum + (f.satisfactionScore || 0), 0) / recentFeedbacks.length
      : 0;
    
    return {
      totalFeedbacks: patterns.totalFeedbacks,
      completionRate: Math.round(completionRate * 100),
      averageSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      lastTrainingAt: patterns.lastTrainingAt,
      topHours: Array.from(patterns.preferredTimeSlots.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, score]) => ({ hour, score: Math.round(score * 100) })),
      categorySuccess: Array.from(patterns.activitySuccessRates.entries())
        .map(([cat, rate]) => ({ category: cat, rate: Math.round(rate * 100) }))
    };
  }
}

module.exports = new MLPlanningService();