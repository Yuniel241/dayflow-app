import React, { useState, useEffect } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/dates';
import { renderLucideIcon } from '../utils/icons';
import { 
  TrendingUp, TrendingDown, Target, CalendarDays, Star, CheckCircle2,
  Award, Flame, Clock, BarChart3, Zap, ArrowUp, ArrowDown, 
  Smile, Meh, Frown, Activity, Brain 
} from 'lucide-react';

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // 'all', '4weeks', '8weeks'
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 1024;

  useEffect(() => {
    api.get('/stats/overview').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 80,
      gap: 16
    }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        border: '3px solid #e2e8f0', 
        borderTopColor: '#22c55e', 
        borderRadius: '50%', 
        animation: 'spin 0.8s linear infinite' 
      }} />
      <p style={{ color: '#64748b' }}>Chargement de vos statistiques...</p>
    </div>
  );
  
  if (!data?.weeklyStats?.length) return (
    <div style={{ 
      textAlign: 'center', 
      padding: 80,
      background: '#fff',
      borderRadius: 24,
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: 20,
        opacity: 0.5
      }}>
        {renderLucideIcon('BarChart3', 64, '#94a3b8')}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
        Pas encore de données
      </h3>
      <p style={{ color: '#64748b' }}>
        Commencez à cocher des tâches dans votre planning pour voir vos statistiques apparaître ici !
      </p>
    </div>
  );

  // Préparer les données
  const weeklyData = [...data.weeklyStats].reverse().map((w, idx) => ({
    week: w.weekStart?.slice(5),
    fullWeek: w.weekStart,
    rate: w.rate,
    done: w.done,
    total: w.total,
    weekNumber: idx + 1,
  }));

  const catData = Object.entries(data.categoryStats).map(([cat, s]) => ({
    name: cat,
    rate: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    done: s.done,
    total: s.total,
    icon: CATEGORY_ICONS[cat] || 'Pin',
    color: CATEGORY_COLORS[cat] || '#94a3b8',
  })).sort((a, b) => b.rate - a.rate);

  const latest = data.weeklyStats[0];
  const previous = data.weeklyStats[1];
  const avgRate = Math.round(data.weeklyStats.reduce((s, w) => s + w.rate, 0) / data.weeklyStats.length);
  
  // Calculer la progression
  const progression = previous ? latest.rate - previous.rate : 0;
  const bestWeek = data.weeklyStats.reduce((best, w) => w.rate > best.rate ? w : best, data.weeklyStats[0]);
  const totalTasksCompleted = data.weeklyStats.reduce((s, w) => s + w.done, 0);
  
  // Données pour le graphique circulaire
  const pieData = catData.filter(c => c.total > 0).map(c => ({
    name: c.name,
    value: c.done,
    color: c.color
  }));

  // Filtrer les données selon la période
  const filteredWeeklyData = timeframe === 'all' 
    ? weeklyData 
    : weeklyData.slice(-parseInt(timeframe));

  const getTrendIcon = () => {
    if (progression > 5) return <TrendingUp size={18} color="#22c55e" />;
    if (progression < -5) return <TrendingDown size={18} color="#ef4444" />;
    return <Activity size={18} color="#f59e0b" />;
  };

  const getProgressMessage = () => {
    if (latest.rate >= 80) return { text: "Exceptionnel ! Continuez sur cette lancée 🔥", icon: Flame, color: "#fbbf24" };
    if (latest.rate >= 60) return { text: "Très bonne semaine, vous êtes sur la bonne voie ⭐", icon: Star, color: "#22c55e" };
    if (latest.rate >= 40) return { text: "Bonne progression, un petit effort supplémentaire 💪", icon: Target, color: "#3b82f6" };
    if (latest.rate >= 20) return { text: "Chaque jour compte, continuez à avancer 📈", icon: TrendingUp, color: "#f59e0b" };
    return { text: "Commencez par de petits objectifs, la constance est la clé 🎯", icon: Target, color: "#8b5cf6" };
  };

  const progressMessage = getProgressMessage();
  const ProgressIcon = progressMessage.icon;

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      animation: 'fadeIn 0.4s ease-out',
      padding: '0 8px'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34,197,94,0.25)'
          }}>
            <BarChart3 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Statistiques
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              Analysez votre progression et découvrez vos tendances
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {[
          { 
            label: 'Score cette semaine', 
            value: `${latest?.rate ?? 0}%`, 
            icon: Star, 
            color: '#22c55e',
            subtext: progression !== 0 && `${progression > 0 ? '+' : ''}${progression}% vs semaine dernière`,
            trend: progression
          },
          { 
            label: 'Score moyen', 
            value: `${avgRate}%`, 
            icon: Target, 
            color: '#3b82f6',
            subtext: `sur ${data.weeklyStats.length} semaines`
          },
          { 
            label: 'Meilleure semaine', 
            value: `${bestWeek?.rate ?? 0}%`, 
            icon: Award, 
            color: '#fbbf24',
            subtext: bestWeek?.weekStart?.slice(5)
          },
          { 
            label: 'Tâches complétées', 
            value: totalTasksCompleted, 
            icon: CheckCircle2, 
            color: '#8b5cf6',
            subtext: `au total`
          },
        ].map((k, idx) => (
          <div key={k.label} style={{
            background: '#fff',
            borderRadius: 20,
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'all 0.3s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
          }}>
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `${k.color}10`,
              pointerEvents: 'none'
            }} />
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${k.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <k.icon size={20} color={k.color} />
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{k.label}</div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              color: '#0f172a', 
              fontFamily: 'monospace',
              marginBottom: 4
            }}>
              {k.value}
            </div>
            {k.subtext && (
              <div style={{ 
                fontSize: 11, 
                color: k.trend ? (k.trend > 0 ? '#22c55e' : k.trend < 0 ? '#ef4444' : '#64748b') : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {k.trend !== undefined && (k.trend > 0 ? <ArrowUp size={12} /> : k.trend < 0 ? <ArrowDown size={12} /> : null)}
                {k.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message de progression */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid #bbf7d0'
      }}>
        <ProgressIcon size={24} color={progressMessage.color} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 2 }}>
            Analyse de votre progression
          </div>
          <div style={{ fontSize: 14, color: '#14532d' }}>
            {progressMessage.text}
          </div>
        </div>
      </div>

      {/* Graphique d'évolution avec contrôle de période */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: 24,
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Évolution hebdomadaire
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Suivi de votre taux de complétion semaine après semaine
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: '4weeks', label: '4 semaines' },
              { value: '8weeks', label: '8 semaines' },
              { value: 'all', label: 'Tout' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                  background: timeframe === option.value ? '#22c55e' : '#fff',
                  color: timeframe === option.value ? '#fff' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={filteredWeeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false}
              label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
            />
            <Tooltip 
              formatter={(v) => [`${v}%`, 'Taux de complétion']}
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 12,
                padding: '8px 12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={{ fill: '#22c55e', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#16a34a' }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Stats additionnelles */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Moyenne glissante</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{avgRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Plus haute progression</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{bestWeek.rate}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Tendance actuelle</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {getTrendIcon()}
              <span style={{ fontSize: 14, fontWeight: 600, color: progression > 0 ? '#22c55e' : progression < 0 ? '#ef4444' : '#64748b' }}>
                {progression > 0 ? `+${progression}%` : progression < 0 ? `${progression}%` : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deux colonnes : Catégories + Répartition */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr', gap: 24 }}>
        {/* Catégories */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Performance par catégorie
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Taux de complétion détaillé
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {catData.map((c) => (
              <div key={c.name}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 8,
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: '#0f172a', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6 
                  }}>
                    {renderLucideIcon(c.icon, 14, c.color)} {c.name}
                  </span>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: c.rate >= 70 ? '#22c55e' : c.rate >= 40 ? '#f59e0b' : '#ef4444',
                    fontFamily: 'monospace'
                  }}>
                    {c.rate}%
                  </span>
                </div>
                <div style={{ 
                  height: 8, 
                  background: '#f1f5f9', 
                  borderRadius: 4, 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${c.rate}%`, 
                    background: c.color, 
                    borderRadius: 4, 
                    transition: 'width 0.6s ease' 
                  }} />
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#64748b', 
                  marginTop: 4 
                }}>
                  {c.done} / {c.total} tâches complétées
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique circulaire */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Répartition des tâches
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Distribution par catégorie
            </p>
          </div>
          
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} tâches`, 'Complétées']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: 280, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#64748b',
              flexDirection: 'column',
              gap: 12
            }}>
              <BarChart3 size={48} color="#cbd5e1" />
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Style d'animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px);
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