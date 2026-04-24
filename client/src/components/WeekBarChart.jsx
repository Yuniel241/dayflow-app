import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDayShort } from '../utils/dates';

export default function WeekBarChart({ days }) {
  const data = (days || []).map((d) => {
    const total = d.slots.length;
    const done = d.slots.filter((s) => s.done).length;
    const notDone = total - done;
    return {
      name: getDayShort(d.date),
      done,
      notDone,
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return (
    <div style={{
      background:'#fff', borderRadius:14, padding:'16px 12px 8px',
      border:'1px solid var(--border-light)', boxShadow:'var(--shadow)',
    }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5, marginBottom:12, textAlign:'center' }}>
        Progression des tâches hebdomadaires
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="30%" barGap={2}>
          <XAxis dataKey="name" tick={{ fontSize:10, fill:'#7a9a77', fontFamily:'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize:11, borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(v, n) => [v, n === 'done' ? 'Complétées' : 'Restantes']}
          />
          <Bar dataKey="done" stackId="a" fill="#4ade80" radius={[0,0,0,0]}>
            {data.map((_, i) => <Cell key={i} fill="#4ade80" />)}
          </Bar>
          <Bar dataKey="notDone" stackId="a" fill="#d4e8cd" radius={[4,4,0,0]}>
            {data.map((_, i) => <Cell key={i} fill="#d4e8cd" />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
