const mlPlanningService = require('./mlPlanningService');

class FeedbackService {
  
  // Collecte automatiquement le feedback quand l'utilisateur coche une tâche
  async collectFromSlot(userId, slot, date, completed, estimatedDuration) {
    const feedbackData = {
      activityId: slot.activityId,
      activityName: slot.activityName,
      category: slot.category,
      date: date,
      completed: completed,
      plannedStartTime: slot.startTime,
      estimatedDuration: estimatedDuration || slot.duration,
      satisfactionScore: completed ? 4 : null, // Par défaut, sera ajusté manuellement
    };
    
    const result = await mlPlanningService.saveFeedback(userId, feedbackData);
    if (!result?.success) {
      throw new Error(result?.error || 'Impossible de sauvegarder le feedback automatique');
    }
    return result;
  }
  
  // Pour un feedback détaillé avec note de satisfaction
  async collectDetailedFeedback(userId, data) {
    const result = await mlPlanningService.saveFeedback(userId, data);
    if (!result?.success) {
      throw new Error(result?.error || 'Impossible de sauvegarder le feedback detaille');
    }
    return result;
  }
  
  // Calcule l'efficacité d'une tâche (temps réel vs prévu)
  calculateEfficiency(actualDuration, plannedDuration) {
    if (!actualDuration || !plannedDuration) return null;
    const ratio = actualDuration / plannedDuration;
    if (ratio <= 0.8) return 'excellent';
    if (ratio <= 1.1) return 'bon';
    if (ratio <= 1.5) return 'acceptable';
    return 'a_ameliorer';
  }
}

module.exports = new FeedbackService();