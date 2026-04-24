import React from 'react';
import { getDayName } from '../utils/dates';
import { AlertTriangle, Star } from 'lucide-react';

export default function WeekInsights({ planning }) {
  if (!planning) return null;

  const dayStats = planning.days.map((d) => {
    const total = d.slots.length;
    const done = d.slots.filter((s) => s.done).length;
    return { date: d.date, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  const strongest = [...dayStats].sort((a, b) => b.rate - a.rate)[0];
  const weakest = [...dayStats].sort((a, b) => a.rate - b.rate)[0];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Strongest day */}
      <div style={{
        background:'#fff', borderRadius:12, padding:'16px',
        border:'1px solid var(--border-light)', boxShadow:'var(--shadow)',
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>
          Cette semaine
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <Star size={14} color="#22c55e" />
            <span style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>Meilleur jour</span>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'capitalize' }}>
            {strongest ? getDayName(strongest.date) : '—'}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#22c55e', fontFamily:'Space Mono, monospace' }}>
            {strongest?.rate ?? 0}%
          </div>
        </div>

        <div style={{ height:1, background:'var(--border-light)', margin:'8px 0' }} />

        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span style={{ fontSize:11, fontWeight:700, color:'#f59e0b' }}>À améliorer</span>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'capitalize' }}>
            {weakest ? getDayName(weakest.date) : '—'}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f59e0b', fontFamily:'Space Mono, monospace' }}>
            {weakest?.rate ?? 0}%
          </div>
        </div>
      </div>

      {/* Score */}
      <div style={{
        background:'#4a7c59', borderRadius:12, padding:'16px', textAlign:'center',
        boxShadow:'var(--shadow)',
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>
          Score de productivité
        </div>
        <div style={{ fontSize:36, fontWeight:800, color:'#fff', fontFamily:'Space Mono, monospace' }}>
          {planning.productivityScore ?? 0}%
        </div>
        <div style={{ marginTop:8, height:6, background:'rgba(255,255,255,0.2)', borderRadius:3, overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${planning.productivityScore ?? 0}%`,
            background:'#4ade80', borderRadius:3, transition:'width .6s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
