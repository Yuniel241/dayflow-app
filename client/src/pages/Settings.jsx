import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Loader2, Save, X, Settings2, Clock, Lightbulb, 
  AlarmClock, Bed, GraduationCap, Home, ChevronRight,
  Sun, Moon, Sparkles, TrendingUp, Brain
} from 'lucide-react';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [formData, setFormData] = useState({
    wakeUpTime: '05:00',
    sleepTime: '22:00',
    courseStartTime: '06:00',
    courseEndTime: '18:00',
    arrivalTime: '20:30',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        wakeUpTime: user.wakeUpTime || '05:00',
        sleepTime: user.sleepTime || '22:00',
        courseStartTime: user.courseStartTime || '06:00',
        courseEndTime: user.courseEndTime || '18:00',
        arrivalTime: user.arrivalTime || '20:30',
      });
    }
  }, [user]);

  useEffect(() => {
    // Fetch ML stats to show learning progress
    const fetchMLStats = async () => {
      try {
        const res = await api.get('/planning/ml-stats');
        setMlStats(res.data);
      } catch (err) {
        console.log('ML stats not available yet');
      }
    };
    fetchMLStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const wake = parseInt(formData.wakeUpTime.replace(':', ''));
    const sleep = parseInt(formData.sleepTime.replace(':', ''));
    const courseStart = parseInt(formData.courseStartTime.replace(':', ''));
    const courseEnd = parseInt(formData.courseEndTime.replace(':', ''));
    const arrival = parseInt(formData.arrivalTime.replace(':', ''));

    if (wake >= sleep) {
      setMessage({ type: 'error', text: '⏰ Le réveil doit être avant le coucher' });
      return;
    }
    if (courseStart >= courseEnd) {
      setMessage({ type: 'error', text: '📚 Le début des cours doit être avant la fin' });
      return;
    }
    if (courseEnd >= arrival) {
      setMessage({ type: 'error', text: '🚕 La fin des cours doit être avant l\'arrivée' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/auth/settings', formData);
      setUser(res.data.user);
      setMessage({ type: 'success', text: '✨ Paramètres mis à jour avec succès !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la mise à jour',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        wakeUpTime: user.wakeUpTime || '05:00',
        sleepTime: user.sleepTime || '22:00',
        courseStartTime: user.courseStartTime || '06:00',
        courseEndTime: user.courseEndTime || '18:00',
        arrivalTime: user.arrivalTime || '20:30',
      });
    }
  };

  const getProductivityMessage = () => {
    if (!mlStats) return "Configurez vos horaires pour commencer";
    if (mlStats.completionRate > 80) return " Exceptionnel ! Vous êtes très productif";
    if (mlStats.completionRate > 60) return " Bon rythme, continuez comme ça";
    if (mlStats.completionRate > 40) return " En progression, chaque jour compte";
    return " Commencez par cocher vos tâches pour voir votre progression";
  };

  return (
    <div style={{ 
      animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 24px'
    }}>
      {/* Header avec effet gradient */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 12
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(34,197,94,0.25)'
          }}>
            <Settings2 size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4
            }}>
              Paramètres
            </h1>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Personnalisez votre planning intelligent
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        {/* Formulaire principal */}
        <form onSubmit={handleSave}>
          {message && (
            <div style={{
              padding: '14px 20px',
              borderRadius: 16,
              marginBottom: 24,
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              fontSize: 14,
              fontWeight: 500,
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: 18 }}>{message.type === 'success' ? '✓' : '⚠️'}</span>
              {message.text}
            </div>
          )}

          {/* Carte des horaires */}
          <div style={{
            background: '#fff',
            borderRadius: 24,
            border: '1px solid #e2e8f0',
            padding: 32,
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'all 0.3s',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 28,
              paddingBottom: 16,
              borderBottom: '2px solid #f1f5f9'
            }}>
              <Clock size={20} color="#22c55e" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Horaires quotidiens
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Réveil */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 10 
                }}>
                  <Sun size={14} color="#eab308" /> Lever
                </label>
                <input
                  type="time"
                  name="wakeUpTime"
                  value={formData.wakeUpTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Coucher */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 10 
                }}>
                  <Moon size={14} color="#3b82f6" /> Coucher
                </label>
                <input
                  type="time"
                  name="sleepTime"
                  value={formData.sleepTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Début Cours */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 10 
                }}>
                  <GraduationCap size={14} color="#8b5cf6" /> Début cours
                </label>
                <input
                  type="time"
                  name="courseStartTime"
                  value={formData.courseStartTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Fin Cours */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 10 
                }}>
                  <GraduationCap size={14} color="#8b5cf6" /> Fin cours
                </label>
                <input
                  type="time"
                  name="courseEndTime"
                  value={formData.courseEndTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Arrivée */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 10 
                }}>
                  <Home size={14} color="#10b981" /> Arrivée à domicile
                </label>
                <input
                  type="time"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Info box améliorée */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid #bbf7d0',
              borderRadius: 16,
              padding: '16px 20px',
              marginTop: 28,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Lightbulb size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, margin: 0 }}>
                  <strong>Ces paramètres structurent votre planning intelligent</strong> — nos algorithmes vont automatiquement bloquer vos créneaux fixes (sommeil, cours, transport) et optimiser vos tâches flexibles.
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: '2px solid #e2e8f0',
                  background: '#fff',
                  color: '#475569',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <X size={16} /> Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 28px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(34,197,94,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.3)';
                }}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar ML Stats */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: 24,
            padding: 24,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Brain size={24} color="#22c55e" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Intelligence ML
              </h3>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 1.5 }}>
              Notre IA apprend de vos habitudes pour améliorer vos plannings
            </p>

            {mlStats ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Apprentissage</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                      {mlStats.totalFeedbacks || 0} feedbacks
                    </span>
                  </div>
                  <div style={{
                    height: 6,
                    background: '#334155',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, ((mlStats.totalFeedbacks || 0) / 50) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                      borderRadius: 3,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                    {mlStats.totalFeedbacks >= 50 
                      ? " Modèle bien entraîné" 
                      : ` ${50 - (mlStats.totalFeedbacks || 0)} feedbacks pour un modèle optimal`}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Taux de complétion</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                      {mlStats.completionRate || 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Satisfaction moyenne</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                      {mlStats.averageSatisfaction || 0}/5
                    </span>
                  </div>
                </div>

                {mlStats.topHours && mlStats.topHours.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase' }}>
                       Vos pics de productivité
                    </p>
                    {mlStats.topHours.map((hour, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: 'rgba(34,197,94,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#22c55e'
                        }}>
                          {hour.hour}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            height: 6,
                            background: '#334155',
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${hour.score}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                              borderRadius: 3
                            }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(hour.score)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: 20,
                textAlign: 'center'
              }}>
                <Sparkles size={32} color="#22c55e" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Commencez à utiliser l'application pour activer l'apprentissage automatique
                </p>
              </div>
            )}

            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: 11,
              color: '#64748b',
              textAlign: 'center'
            }}>
              <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
              Plus vous utilisez DayFlow, plus les plannings deviennent intelligents
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}