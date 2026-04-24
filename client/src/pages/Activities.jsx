import React, { useState, useEffect } from 'react';
import { BookmarkPlus } from 'lucide-react';
import api from '../api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/dates';
import { ACTIVITY_ICON_CHOICES, renderLucideIcon } from '../utils/icons';
import { getWeekStart } from '../utils/dates';

const DAYS = ['lun','mar','mer','jeu','ven','sam','dim'];
const DAY_LABELS = { lun:'Lun', mar:'Mar', mer:'Mer', jeu:'Jeu', ven:'Ven', sam:'Sam', dim:'Dim' };
const CATEGORIES = ['études','loisirs','projet','routine','sport','autre'];
const PRIORITIES = [
  { value: 1, label: 'Haute', color: '#ef4444' },
  { value: 2, label: 'Moyenne', color: '#f59e0b' },
  { value: 3, label: 'Basse', color: '#22c55e' },
];

const empty = {
  name: '', duration: 60, priority: 2,
  category: 'autre', type: 'flexible',
  days: [], deadline: '', icon: 'Pin', color: '#4ade80',
};

const IconPicker = ({ selectedIcon, onChange }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(5, 1fr)', 
    gap: '8px', 
    padding: '10px', 
    background: 'var(--bg-card2)', 
    borderRadius: '12px',
    border: '1px solid var(--border)' 
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
          borderRadius: '8px',
          border: selectedIcon === iconName ? '2px solid #22c55e' : '1px solid transparent',
          background: selectedIcon === iconName ? '#f0fdf4' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {renderLucideIcon(iconName, 20, selectedIcon === iconName ? '#22c55e' : '#64748b')}
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
      // Mettre à jour le planning en arrière-plan (sans perdre les cases cochées).
      api.post(`/planning/generate/${getWeekStart()}`).catch(() => {});
      setForm(empty); setEditing(null); setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const edit = (a) => {
    setForm({ ...a, deadline: a.deadline || '', icon: a.icon || CATEGORY_ICONS[a.category] || 'Pin' });
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

  const inp = { padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:13, width:'100%', color:'var(--text)', background:'var(--bg)' };

  return (
    <div style={{ maxWidth: 900, animation:'fadeIn .3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
            {renderLucideIcon('CheckCircle2', 20, '#166534')} Mes activités
          </h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>{activities.length} activité(s) configurée(s)</p>
        </div>
          <button 
            onClick={openNew} 
            style={{
              display: 'flex',          // Permet d'aligner l'icône et le texte
              alignItems: 'center',      // Centre verticalement
              gap: '8px',                // Espace entre l'icône et le texte
              padding: '10px 20px', 
              borderRadius: '10px', 
              background: '#22c55e',
              color: '#fff', 
              fontWeight: 700, 
              fontSize: '13px',
              border: 'none',            // Supprime la bordure par défaut
              cursor: 'pointer',         // Change le curseur en main
              transition: 'all 0.2s',    // Animation douce pour le hover
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)', // Ombre légère colorée
            }}
            // Optionnel : petit effet d'assombrissement au survol
            onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
          >
            <BookmarkPlus size={18} />   {/* Taille harmonisée avec le texte */}
            <span>Nouvelle activité</span>
          </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
        }} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background:'#fff', borderRadius:16, padding:'28px', width:'100%', maxWidth:520,
            boxShadow:'var(--shadow-lg)', animation:'fadeIn .2s ease', maxHeight:'90vh', overflowY:'auto',
          }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:20, color:'var(--text)' }}>
              {editing ? 'Modifier l\'activité' : 'Nouvelle activité'}
            </h2>
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:12 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Ligne du Nom */}
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Nom de l'activité</label>
                  <input style={inp} placeholder="Ex: Yoga, Révisions..." value={form.name}
                    onChange={e => setForm({...form, name:e.target.value})} required />
                </div>

                {/* Sélecteur d'icônes visuel */}
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:8}}>Choisir une icône</label>
                  <IconPicker 
                    selectedIcon={form.icon} 
                    onChange={(iconName) => setForm({ ...form, icon: iconName })} 
                  />
                </div>
                
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Durée (min)</label>
                  <input style={inp} type="number" min="5" value={form.duration}
                    onChange={e => setForm({...form, duration:+e.target.value})} />
                </div>
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Type</label>
                  <select style={inp} value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                    <option value="flexible">Flexible</option>
                    <option value="fixe">Fixe</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Catégorie</label>
                  <select
                    style={inp}
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value, icon: CATEGORY_ICONS[e.target.value] || form.icon })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Priorité</label>
                  <select style={inp} value={form.priority} onChange={e => setForm({...form, priority:+e.target.value})}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {form.type === 'fixe' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Heure début</label>
                    <input style={inp} type="time" value={form.startTime || ''} onChange={e => setForm({...form, startTime:e.target.value})} />
                  </div>
                  <div>
                    <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>Heure fin</label>
                    <input style={inp} type="time" value={form.endTime || ''} onChange={e => setForm({...form, endTime:e.target.value})} />
                  </div>
                </div>
              )}

              <div>
                <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:6}}>
                  Jours (vide = tous les jours)
                </label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {DAYS.map(d => (
                    <button type="button" key={d} onClick={() => toggleDay(d)} style={{
                      padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                      background: form.days.includes(d) ? '#22c55e' : 'var(--bg-card2)',
                      color: form.days.includes(d) ? '#fff' : 'var(--text-3)',
                      border: form.days.includes(d) ? '1px solid #22c55e' : '1px solid var(--border)',
                      transition:'all .15s',
                    }}>
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{fontSize:11, fontWeight:700, color:'var(--text-3)', display:'block', marginBottom:4}}>
                  Couleur
                </label>
                <input type="color" value={form.color} onChange={e => setForm({...form, color:e.target.value})}
                  style={{ height:32, width:60, borderRadius:6, border:'1px solid var(--border)', cursor:'pointer' }} />
              </div>

              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button type="submit" style={{ flex:1, padding:'10px', borderRadius:8, background:'#22c55e', color:'#fff', fontWeight:700, fontSize:13 }}>
                  {editing ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding:'10px 16px', borderRadius:8, background:'var(--bg-card2)', color:'var(--text-2)', fontWeight:700, fontSize:13 }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Chargement…</div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>{renderLucideIcon('ClipboardList', 40, '#94a3b8')}</div>
          <p>Aucune activité. Commence par en ajouter une !</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {activities.map((a) => {
            const prio = PRIORITIES.find(p => p.value === a.priority);
            return (
              <div key={a._id} style={{
                background:'#fff', borderRadius:12, padding:'14px 16px',
                border:'1px solid var(--border-light)', boxShadow:'var(--shadow)',
                display:'flex', alignItems:'center', gap:12,
                animation:'fadeIn .2s ease',
              }}>
                <div style={{
                  width:10, height:10, borderRadius:'50%', flexShrink:0,
                  background: a.color,
                }} />
                <span style={{ display:'flex', alignItems:'center' }}>
                  {renderLucideIcon(a.icon || CATEGORY_ICONS[a.category], 18, '#334155')}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', display:'flex', gap:8, marginTop:2, flexWrap:'wrap' }}>
                    <span>{a.duration} min</span>
                    <span>•</span>
                    <span>{a.category}</span>
                    <span>•</span>
                    <span style={{ color: prio?.color }}>{prio?.label}</span>
                    {a.days.length > 0 && <><span>•</span><span>{a.days.join(', ')}</span></>}
                  </div>
                </div>
                <span style={{
                  fontSize:10, padding:'3px 8px', borderRadius:20,
                  background: a.type === 'fixe' ? '#fef3c7' : '#f0fdf4',
                  color: a.type === 'fixe' ? '#92400e' : '#166534',
                  fontWeight:700, flexShrink:0,
                }}>
                  {a.type}
                </span>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => edit(a)} style={{
                    padding:'6px 12px', borderRadius:8,
                    background:'var(--bg-card2)', color:'var(--text-2)', fontSize:11, fontWeight:700,
                  }}>Modifier</button>
                  <button onClick={() => del(a._id)} style={{
                    padding:'6px 12px', borderRadius:8,
                    background:'#fef2f2', color:'#ef4444', fontSize:11, fontWeight:700,
                  }}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
