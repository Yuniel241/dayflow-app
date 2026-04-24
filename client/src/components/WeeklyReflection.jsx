import React, { useState, useEffect } from 'react';
import api from '../api';
import { Award, Clock3, Focus } from 'lucide-react';

export default function WeeklyReflection({ weekStart, reflection, onSaved }) {
  const [data, setData] = useState({ bestWin: '', slowedDown: '', nextFocus: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (reflection) setData(reflection);
  }, [reflection]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/planning/${weekStart}/reflection`, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'bestWin', label: 'Meilleure réussite cette semaine', icon: Award },
    { key: 'slowedDown', label: 'Ce qui m\'a ralenti', icon: Clock3 },
    { key: 'nextFocus', label: 'Focus de la semaine prochaine', icon: Focus },
  ];

  return (
    <div style={{
      background:'#fff', borderRadius:14, padding:'20px',
      border:'1px solid var(--border-light)', boxShadow:'var(--shadow)',
    }}>
      <div style={{
        background:'#4a7c59', color:'#fff', borderRadius:8, padding:'8px 16px',
        textAlign:'center', fontWeight:700, fontSize:13, marginBottom:16, letterSpacing:.5,
      }}>
        Réflexion hebdomadaire
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {fields.map(({ key, label, icon: Icon }) => (
          <div key={key} style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16, alignItems:'start' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', paddingTop:8, display:'flex', alignItems:'center', gap:6 }}>
              <Icon size={14} color="#166534" /> {label}
            </span>
            <textarea
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
              rows={2}
              style={{
                resize:'none', padding:'8px 12px', borderRadius:8,
                border:'1px solid var(--border)', fontSize:13,
                color:'var(--text)', background:'var(--bg)',
                lineHeight:1.5, transition:'border .15s',
              }}
              onFocus={e => e.target.style.border='1px solid #22c55e'}
              onBlur={e => e.target.style.border='1px solid var(--border)'}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding:'8px 20px', borderRadius:8, background:'#22c55e',
            color:'#fff', fontWeight:700, fontSize:13, transition:'all .15s',
          }}
        >
          {saved ? '✓ Sauvegardé' : saving ? '...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
