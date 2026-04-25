const DEFAULT_ML_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT_MS = 8000;

class MLApiService {
  constructor() {
    this.baseUrl = (process.env.ML_API_URL || DEFAULT_ML_API_URL).replace(/\/$/, '');
    this.required = process.env.ML_API_REQUIRED === 'true';
    this.enabled = process.env.ML_API_ENABLED !== 'false';
  }

  async request(path, payload) {
    if (typeof fetch !== 'function') {
      throw new Error('Global fetch indisponible (Node.js >= 18 requis)');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`ML API ${response.status}: ${text || response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  normalizeUser(user) {
    return {
      wakeUpTime: user.wakeUpTime || '05:00',
      sleepTime: user.sleepTime || '22:00',
      courseStartTime: user.courseStartTime || '06:00',
      courseEndTime: user.courseEndTime || '18:00',
      arrivalTime: user.arrivalTime || '20:30',
      energyPeaks: user.energyPeaks || ['08:00', '14:00'],
      preferredWorkDays: user.preferredWorkDays || ['lun', 'mar', 'mer', 'jeu', 'ven'],
      avgProductivityScore: user.avgProductivityScore || 0.7,
    };
  }

  normalizeActivities(activities) {
    return (activities || []).map((activity) => ({
      _id: activity._id?.toString(),
      name: activity.name,
      duration: activity.duration,
      priority: activity.priority,
      category: activity.category,
      type: activity.type,
      color: activity.color,
      startTime: activity.startTime || null,
      endTime: activity.endTime || null,
      days: Array.isArray(activity.days) ? activity.days : [],
      deadline: activity.deadline || null,
      isActive: activity.isActive !== false,
      emoji: activity.emoji || '📌',
    }));
  }

  async generatePlanning({ user, userId, activities, weekStart }) {
    if (!this.enabled) {
      return {
        success: false,
        reason: 'disabled',
        error: 'ML API disabled by configuration',
      };
    }

    const payload = {
      userId: userId.toString(),
      user: this.normalizeUser(user),
      activities: this.normalizeActivities(activities),
      weekStart,
    };

    try {
      const result = await this.request('/api/generate-planning', payload);
      if (!result?.success || !Array.isArray(result.planning)) {
        throw new Error('ML API response format invalid');
      }

      return {
        success: true,
        planning: result.planning,
        statistics: result.statistics || null,
        mlActive: result.ml_active === true,
      };
    } catch (error) {
      if (this.required) {
        throw new Error(`ML API required but unavailable: ${error.message}`);
      }

      return {
        success: false,
        reason: 'unavailable',
        error: error.message,
      };
    }
  }

  async submitFeedback(feedbackData) {
    if (!this.enabled) return { success: false, reason: 'disabled' };

    try {
      const payload = {
        userId: feedbackData.userId.toString(),
        activityId: feedbackData.activityId?.toString() || 'unknown',
        date: feedbackData.date,
        completed: Boolean(feedbackData.completed),
        satisfactionScore: feedbackData.satisfactionScore || 3,
        actualDuration: feedbackData.actualDuration || null,
      };

      const result = await this.request('/api/feedback', payload);
      return { success: result?.success === true };
    } catch (error) {
      if (this.required) {
        throw new Error(`ML API feedback submission failed: ${error.message}`);
      }

      return {
        success: false,
        reason: 'unavailable',
        error: error.message,
      };
    }
  }
}

module.exports = new MLApiService();
