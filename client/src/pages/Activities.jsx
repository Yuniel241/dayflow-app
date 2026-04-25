import React, { useState, useEffect } from 'react';
import { BookmarkPlus, Edit2, Trash2, Clock, Calendar, Flag, Tag, X, Check, Zap } from 'lucide-react';
import api from '../api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/dates';
import { ACTIVITY_ICON_CHOICES, renderLucideIcon } from '../utils/icons';
import { getWeekStart } from '../utils/dates';

const DAYS = ['lun','mar','mer','jeu','ven','sam','dim'];
const DAY_LABELS = { lun:'Lun', mar:'Mar', mer:'Mer', jeu:'Jeu', ven:'Ven', sam:'Sam', dim:'Dim' };
const CATEGORIES = [
  { value: 'études', label: 'Études', icon: 'GraduationCap', color: '#3b82f6' },
  { value: 'loisirs', label: 'Loisirs', icon: 'Gamepad2', color: '#8b5cf6' },
  { value: 'projet', label: 'Projet', icon: 'Briefcase', color: '#f59e0b' },
  { value: 'routine', label: 'Routine', icon: 'RefreshCw', color: '#10b981' },
  { value: 'sport', label: 'Sport', icon: 'Dumbbell', color: '#ef4444' },
  { value: 'autre', label: 'Autre', icon: 'MoreHorizontal', color: '#64748b' },
];
const PRIORITIES = [
  { value: 1, label: 'Haute', color: '#ef4444', icon: 'Flag' },
  { value: 2, label: 'Moyenne', color: '#f59e0b', icon: 'Flag' },
  { value: 3, label: 'Basse', color: '#22c55e', icon: 'Flag' },
];

const empty = {
  name: '', duration: 60, priority: 2,
  category: 'autre', type: 'flexible',
  days: [], deadline: '', icon: 'Zap', color: '#4ade80',
};

const IconPicker = ({ selectedIcon, onChange, isMobile }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)', 
    gap: '8px', 
    padding: '12px', 
    background: '#f8fafc', 
    borderRadius: '16px',
    border: '1px solid #e2e8f0' 
  }}>
    {ACTIVITY_ICON_CHOICES.map((iconName) => (
      <button
        key={iconName}
        type="button"
        onClick={() => onChange(iconName)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          borderRadius: '10px',
          border: selectedIcon === iconName ? '2px solid #22c55e' : '1px solid #e2e8f0',
          background: selectedIcon === iconName ? '#f0fdf4' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => {
          if (selectedIcon !== iconName) {
            e.currentTarget.style.background = '#f1f5f9';
          }
        }}
        onMouseLeave={e => {
          if (selectedIcon !== iconName) {
            e.currentTarget.style.background = '#fff';
          }
        }}
      >
        {renderLucideIcon(iconName, 18, selectedIcon === iconName ? '#22c55e' : '#64748b')}
      </button>
    ))}
  </div>
);

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  useEffect(() => {
    api.get('/activities').then((r) => setActivities(r.data.activities)).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await api.put(`/activities/${editing}`, form);
        setActivities(activities.map((a) => a._id === editing ? res.data.activity : a));
      } else {
        const res = await api.post('/activities', form);
        setActivities([...activities, res.data.activity]);
      }
      api.post(`/planning/generate/${getWeekStart()}`).catch(() => {});
      setForm(empty); setEditing(null); setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = (a) => {
    setForm({ ...a, deadline: a.deadline || '', icon: a.icon || CATEGORY_ICONS[a.category] || 'Zap' });
    setEditing(a._id);
    setShowForm(true);
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette activité ?')) return;
    await api.delete(`/activities/${id}`);
    setActivities(activities.filter((a) => a._id !== id));
    api.post(`/planning/generate/${getWeekStart()}`).catch(() => {});
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const openNew = () => { setForm({ ...empty }); setEditing(null); setShowForm(true); };

  const filteredActivities = activities.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    return true;
  });

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[5];
  };

  const inp = { 
    padding: '10px 14px', 
    borderRadius: '12px', 
    border: '2px solid #e2e8f0', 
    fontSize: 13, 
    width: '100%', 
    color: '#0f172a', 
    background: '#fff',
    transition: 'all 0.2s',
    outline: 'none'
  };

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: '0 auto', 
      animation: 'fadeIn 0.4s ease-out',
      padding: isMobile ? '0 12px' : '0 24px'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34,197,94,0.25)'
          }}>
            <Zap size={isMobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Mes activités
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Gérez vos tâches et activités quotidiennes
            </p>
          </div>
        </div>
      </div>

      {/* Stats et bouton */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16
      }}>
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{
            background: '#f0fdf4',
            borderRadius: 12,
            padding: isMobile ? '6px 12px' : '8px 16px',
            border: '1px solid #bbf7d0'
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
              Total: {activities.length} activité(s)
            </span>
          </div>
          <div style={{
            background: '#f1f5f9',
            borderRadius: 12,
            padding: isMobile ? '6px 12px' : '8px 16px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              Flexibles: {activities.filter(a => a.type === 'flexible').length}
            </span>
          </div>
          <div style={{
            background: '#fef3c7',
            borderRadius: 12,
            padding: isMobile ? '6px 12px' : '8px 16px',
            border: '1px solid #fde68a'
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>
              Fixes: {activities.filter(a => a.type === 'fixe').length}
            </span>
          </div>
        </div>
        
        <button 
          onClick={openNew} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '8px 20px' : '10px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(34,197,94,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.3)';
          }}
        >
          <BookmarkPlus size={16} />
          <span>Nouvelle activité</span>
        </button>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexDirection: isMobile ? 'column' : 'row',
        padding: '12px 0'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Type:</span>
          {['all', 'flexible', 'fixe'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: filterType === type ? '#22c55e' : '#f1f5f9',
                color: filterType === type ? '#fff' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {type === 'all' ? 'Tous' : type === 'flexible' ? 'Flexibles' : 'Fixes'}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Catégorie:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Toutes</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form modal - Version responsive améliorée */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: isMobile ? '16px' : '0',
        }} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: isMobile ? '20px' : '32px',
            width: '100%',
            maxWidth: 560,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editing ? 'Modifier l\'activité' : 'Nouvelle activité'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>
            
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Nom de l'activité
                </label>
                <input 
                  style={inp} 
                  placeholder="Ex: Yoga, Révisions, Sport..." 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                  onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Choisir une icône
                </label>
                <IconPicker 
                  selectedIcon={form.icon} 
                  onChange={(iconName) => setForm({ ...form, icon: iconName })}
                  isMobile={isMobile}
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: 12 
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Durée (minutes)
                  </label>
                  <input 
                    style={inp} 
                    type="number" 
                    min="5" 
                    step="5"
                    value={form.duration}
                    onChange={e => setForm({...form, duration: +e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Type
                  </label>
                  <select style={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="flexible">🔄 Flexible</option>
                    <option value="fixe">⏰ Fixe</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: 12 
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Catégorie
                  </label>
                  <select
                    style={inp}
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value, icon: CATEGORY_ICONS[e.target.value] || form.icon })}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Priorité
                  </label>
                  <select style={inp} value={form.priority} onChange={e => setForm({...form, priority: +e.target.value})}>
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label} {p.value === 1 ? '🔴' : p.value === 2 ? '🟠' : '🟢'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.type === 'fixe' && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: 12 
                }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Heure début
                    </label>
                    <input style={inp} type="time" value={form.startTime || ''} onChange={e => setForm({...form, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Heure fin
                    </label>
                    <input style={inp} type="time" value={form.endTime || ''} onChange={e => setForm({...form, endTime: e.target.value})} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Jours de la semaine
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(7, 1fr)', 
                  gap: 8 
                }}>
                  {DAYS.map(d => (
                    <button 
                      type="button" 
                      key={d} 
                      onClick={() => toggleDay(d)} 
                      style={{
                        padding: isMobile ? '10px 0' : '10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        background: form.days.includes(d) ? '#22c55e' : '#f1f5f9',
                        color: form.days.includes(d) ? '#fff' : '#64748b',
                        border: form.days.includes(d) ? 'none' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Couleur
                </label>
                <input 
                  type="color" 
                  value={form.color} 
                  onChange={e => setForm({...form, color: e.target.value})}
                  style={{ 
                    height: 40, 
                    width: '100%', 
                    borderRadius: 12, 
                    border: '2px solid #e2e8f0', 
                    cursor: 'pointer',
                    padding: 4
                  }} 
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 8,
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: 12, 
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Check size={16} />
                  {editing ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  style={{ 
                    padding: '12px 24px', 
                    borderRadius: 12, 
                    background: '#f1f5f9', 
                    color: '#64748b', 
                    fontWeight: 700, 
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity list - Version responsive améliorée */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 80, 
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#22c55e', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>Chargement de vos activités...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? 40 : 80, 
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: 32, 
            background: '#f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            {renderLucideIcon('ClipboardList', 32, '#94a3b8')}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            Aucune activité
          </h3>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            Commencez par ajouter votre première activité !
          </p>
          <button
            onClick={openNew}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              background: '#22c55e',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            + Nouvelle activité
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredActivities.map((a) => {
            const prio = PRIORITIES.find(p => p.value === a.priority);
            const categoryInfo = getCategoryInfo(a.category);
            return (
              <div key={a._id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: isMobile ? '12px' : '16px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? 12 : 16,
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(0,0,0,0.1)';
                if (!isMobile) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {/* Barre de couleur */}
                <div style={{
                  width: isMobile ? '100%' : 4,
                  height: isMobile ? 4 : 40,
                  borderRadius: 2,
                  background: a.color,
                  flexShrink: 0
                }} />
                
                {/* Icône et infos - Version mobile améliorée */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  width: '100%'
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: `${categoryInfo.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {renderLucideIcon(a.icon || CATEGORY_ICONS[a.category], 22, categoryInfo.color)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{a.name}</span>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: a.type === 'fixe' ? '#fef3c7' : '#f0fdf4',
                        color: a.type === 'fixe' ? '#92400e' : '#166534',
                        fontWeight: 600
                      }}>
                        {a.type === 'fixe' ? '⏰ Fixe' : '🔄 Flexible'}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: 12, 
                      flexWrap: 'wrap', 
                      alignItems: 'center' 
                    }}>
                      <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {a.duration} min
                      </span>
                      <span style={{ fontSize: 12, color: prio?.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flag size={12} /> {prio?.label}
                      </span>
                      {a.days.length > 0 && !isMobile && (
                        <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {a.days.map(d => DAY_LABELS[d]).join(', ')}
                        </span>
                      )}
                    </div>
                    {a.days.length > 0 && isMobile && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} /> {a.days.map(d => DAY_LABELS[d]).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions - Version mobile améliorée */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  flexShrink: 0,
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'space-between' : 'flex-end'
                }}>
                  <button 
                    onClick={() => edit(a)} 
                    style={{
                      flex: isMobile ? 1 : 'auto',
                      padding: isMobile ? '8px' : '8px 12px',
                      borderRadius: 10,
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e2e8f0';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f1f5f9';
                    }}
                  >
                    <Edit2 size={14} /> 
                    {!isMobile && 'Modifier'}
                  </button>
                  <button 
                    onClick={() => del(a._id)} 
                    style={{
                      flex: isMobile ? 1 : 'auto',
                      padding: isMobile ? '8px' : '8px 12px',
                      borderRadius: 10,
                      background: '#fef2f2',
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#fee2e2';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                  >
                    <Trash2 size={14} /> 
                    {!isMobile && 'Supprimer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}