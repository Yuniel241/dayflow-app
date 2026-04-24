import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { getWeekStart, addWeeks, getWeekLabel } from '../utils/dates';
import DayColumn from '../components/DayColumn';
import WeekBarChart from '../components/WeekBarChart';
import WeekInsights from '../components/WeekInsights';
import WeeklyReflection from '../components/WeeklyReflection';
import { BookOpen, Loader2, RefreshCw, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [planning, setPlanning] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/planning/week/${weekStart}`);
      setPlanning(res.data.planning);
      console.info('[Planning] Source:', res.data.plannerEngine, {
        warning: res.data.plannerWarning || null,
        weekStart,
      });
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchPlanning(); }, [fetchPlanning]);

  useEffect(() => {
    api.get('/motivation/daily').then((r) => setMotivation(r.data)).catch(() => {});
  }, []);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/planning/generate/${weekStart}`);
      setPlanning(res.data.planning);
      console.info('[Planning] Source after regeneration:', res.data.plannerEngine, {
        warning: res.data.plannerWarning || null,
        weekStart,
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleSlot = async (date, slotIndex, done) => {
    try {
      const res = await api.patch(`/planning/${weekStart}/${date}/slot/${slotIndex}`, { done });
      setPlanning(res.data.planning);
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date();
  const monthLabel = today.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
  const year = today.getFullYear();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn .3s ease' }}>

      {/* Top row: Calendar info + Chart + Insights + Score */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 160px 140px', gap:12 }}>

        {/* Calendar settings */}
        <div style={{
          background:'#4a7c59', borderRadius:14, padding:'16px',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          boxShadow:'var(--shadow-md)',
        }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:1 }}>TASK TRACKER</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:12 }}>—{monthLabel}—</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'8px 12px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:6, letterSpacing:.5 }}>PARAMÈTRES</div>
            {[
              ['ANNÉE', year],
              ['MOIS', monthLabel],
              ['SEMAINE', getWeekLabel(weekStart)],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{k}</span>
                <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
          {/* Week nav */}
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, -1))}
              style={{ flex:1, padding:'6px', borderRadius:6, background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:13, fontWeight:700 }}
            >‹</button>
            <button
              onClick={() => setWeekStart(getWeekStart())}
              style={{ flex:2, padding:'6px', borderRadius:6, background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:10, fontWeight:700 }}
            >Aujourd'hui</button>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              style={{ flex:1, padding:'6px', borderRadius:6, background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:13, fontWeight:700 }}
            >›</button>
          </div>
        </div>

        {/* Bar chart */}
        <WeekBarChart days={planning?.days || []} />

        {/* Insights */}
        <WeekInsights planning={planning} />

        {/* Productivity score large */}
        <div style={{
          background:'#fff', borderRadius:14, border:'1px solid var(--border-light)',
          padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          boxShadow:'var(--shadow)',
        }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8, textAlign:'center' }}>
            Score hebdomadaire
          </div>
          <div style={{ fontSize:42, fontWeight:800, color:'#22c55e', fontFamily:'Space Mono, monospace' }}>
            {planning?.productivityScore ?? 0}%
          </div>
          <div style={{ width:'100%', marginTop:8, height:8, background:'var(--bg-card2)', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', background:'#22c55e', borderRadius:4,
              width:`${planning?.productivityScore ?? 0}%`, transition:'width .6s ease',
            }} />
          </div>
          <button
            onClick={regenerate}
            disabled={generating}
            style={{
              marginTop:12, padding:'6px 12px', borderRadius:8,
              background:'var(--green-50)', color:'var(--green-700)',
              fontSize:11, fontWeight:700, border:'1px solid var(--green-200)',
              transition:'all .15s', width:'100%',
            }}
          >
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              {generating ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
              {generating ? 'Génération...' : 'Régénérer'}
            </span>
          </button>
        </div>
      </div>

      {/* 7-day columns */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'var(--text-3)', fontSize:24 }}>
          <span style={{ animation:'spin 1s linear infinite', display:'inline-flex' }}>
            <Loader2 size={24} color="#16a34a" />
          </span>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
          {(planning?.days || []).map((day) => (
            <DayColumn key={day.date} day={day} onToggleSlot={toggleSlot} />
          ))}
        </div>
      )}

      {/* Motivation */}
      {motivation && (
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
          borderRadius: 20, padding: '24px 28px',
          boxShadow: '0 8px 32px rgba(20, 83, 45, 0.25)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Cercles décoratifs */}
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
          <div style={{ position:'absolute', bottom:-30, left:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

          {/* Verset */}
          <div style={{ display:'flex', gap:14, alignItems:'flex-start', position:'relative' }}>
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background:'rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <BookOpen size={20} color="#4ade80" />
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#4ade80', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
                Verset du jour
              </div>
              <p style={{ fontSize:15, color:'#fff', fontStyle:'italic', lineHeight:1.65, marginBottom:6 }}>
                "{motivation.verse?.text}"
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>— {motivation.verse?.ref}</p>
            </div>
          </div>

          {/* Encouragement */}
          <div style={{ display:'flex', gap:14, alignItems:'flex-start', position:'relative' }}>
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background:'rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Sparkles size={20} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#fbbf24', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
                Encouragement
              </div>
              <p style={{ fontSize:15, color:'#fff', lineHeight:1.65 }}>
                {motivation.encouragement}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly reflection */}
      {planning && (
        <WeeklyReflection
          weekStart={weekStart}
          reflection={planning.weeklyReflection}
          onSaved={fetchPlanning}
        />
      )}
    </div>
  );
}
