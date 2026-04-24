import React, { useState, useEffect } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/dates';
import { renderLucideIcon } from '../utils/icons';

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/overview').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Chargement…</div>;
  if (!data?.weeklyStats?.length) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>{renderLucideIcon('BarChart3', 48, '#94a3b8')}</div>
      <p style={{ color:'var(--text-3)' }}>Pas encore de données. Commence à cocher des tâches !</p>
    </div>
  );

  const weeklyData = [...data.weeklyStats].reverse().map((w) => ({
    week: w.weekStart?.slice(5),
    rate: w.rate,
    done: w.done,
  }));

  const catData = Object.entries(data.categoryStats).map(([cat, s]) => ({
    name: cat,
    rate: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    done: s.done,
    total: s.total,
    icon: CATEGORY_ICONS[cat] || 'Pin',
    color: CATEGORY_COLORS[cat] || '#94a3b8',
  }));

  const latest = data.weeklyStats[0];
  const avgRate = Math.round(data.weeklyStats.reduce((s, w) => s + w.rate, 0) / data.weeklyStats.length);

  return (
    <div style={{ maxWidth:900, animation:'fadeIn .3s ease' }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
        {renderLucideIcon('BarChart3', 22, '#166534')} Statistiques
      </h1>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Semaines suivies', val: data.weeklyStats.length, icon:'CalendarDays' },
          { label:'Score moyen', val:`${avgRate}%`, icon:'Target' },
          { label:'Score cette semaine', val:`${latest?.rate ?? 0}%`, icon:'Star' },
          { label:'Tâches complétées', val: data.weeklyStats.reduce((s,w)=>s+w.done,0), icon:'CheckCircle2' },
        ].map((k) => (
          <div key={k.label} style={{
            background:'#fff', borderRadius:12, padding:'16px',
            border:'1px solid var(--border-light)', boxShadow:'var(--shadow)', textAlign:'center',
          }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>{renderLucideIcon(k.icon, 22, '#166534')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--green-700)', fontFamily:'Space Mono, monospace' }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly evolution */}
      <div style={{
        background:'#fff', borderRadius:14, padding:'20px',
        border:'1px solid var(--border-light)', boxShadow:'var(--shadow)', marginBottom:16,
      }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'var(--text)' }}>Évolution hebdomadaire</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f8ef" />
            <XAxis dataKey="week" tick={{ fontSize:10, fill:'#7a9a77' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#7a9a77' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v}%`, 'Taux']} contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', fontSize:11 }} />
            <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill:'#22c55e', r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div style={{
        background:'#fff', borderRadius:14, padding:'20px',
        border:'1px solid var(--border-light)', boxShadow:'var(--shadow)',
      }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'var(--text)' }}>Taux de complétion par catégorie</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {catData.map((c) => (
            <div key={c.name} style={{ display:'grid', gridTemplateColumns:'140px 1fr 80px', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', display:'flex', alignItems:'center', gap:6 }}>
                {renderLucideIcon(c.icon, 14, '#334155')} {c.name}
              </span>
              <div style={{ height:10, background:'var(--bg-card2)', borderRadius:5, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${c.rate}%`, background:c.color, borderRadius:5, transition:'width .6s ease' }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', textAlign:'right', fontFamily:'Space Mono, monospace' }}>
                {c.done}/{c.total} ({c.rate}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
