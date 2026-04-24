import React from 'react';
import DonutChart from './DonutChart';
import { getDayShort, formatDate, isToday } from '../utils/dates';
import { CATEGORY_ICONS } from '../utils/dates';
import { renderLucideIcon } from '../utils/icons';

export default function DayColumn({ day, onToggleSlot }) {
  const total = day.slots.length;
  const done = day.slots.filter((s) => s.done).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  const today = isToday(day.date);

  const donutColor = rate === 100 ? '#22c55e' : rate >= 60 ? '#84cc16' : rate >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: today ? '2px solid #22c55e' : '1px solid var(--border-light)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: today ? '0 4px 16px rgba(34,197,94,0.15)' : 'var(--shadow)',
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{
        background: today ? '#22c55e' : '#4a7c59',
        padding: '10px 12px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#fff', letterSpacing:1 }}>
          {getDayShort(day.date)}
          {today && <span style={{marginLeft:6, fontSize:10, background:'rgba(255,255,255,0.3)', padding:'1px 6px', borderRadius:20}}>Aujourd'hui</span>}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:1 }}>
          {formatDate(day.date)}
        </div>
      </div>

      {/* Tasks header */}
      <div style={{ padding:'8px 10px 4px', borderBottom:'1px solid var(--border-light)' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.5 }}>
          Tâches
        </span>
      </div>

      {/* Task list */}
      <div style={{ flex:1, padding:'4px 8px', overflowY:'auto', maxHeight:220 }}>
        {day.slots.length === 0 && (
          <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'center', padding:'16px 0' }}>Aucune tâche</p>
        )}
        {day.slots.map((slot, i) => (
          <label key={i} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'4px 2px', cursor:'pointer',
            borderBottom: i < day.slots.length - 1 ? '1px solid #f0f8ef' : 'none',
          }}>
            <input
              type="checkbox"
              checked={slot.done}
              onChange={() => onToggleSlot(day.date, i, !slot.done)}
              style={{ accentColor:'#22c55e', width:13, height:13, flexShrink:0 }}
            />
            <span style={{
              fontSize:11, color: slot.done ? 'var(--text-3)' : 'var(--text)',
              textDecoration: slot.done ? 'line-through' : 'none',
              flex:1, lineHeight:1.3, display:'flex', alignItems:'center', gap:6,
            }}>
              {renderLucideIcon(slot.icon || CATEGORY_ICONS[slot.category] || 'Pin', 13, slot.done ? '#94a3b8' : '#334155')}
              <span>{slot.activityName}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Goal footer */}
      <div style={{
        borderTop:'1px solid var(--border-light)',
        padding:'4px 10px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'#f9fdf8',
      }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)' }}>Objectif</span>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--green-700)' }}>{total}</span>
      </div>

      {/* Donut */}
      <div style={{ padding:'12px 0 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <div style={{ position:'relative', width:72, height:72 }}>
          <DonutChart percent={rate} size={72} color={donutColor} strokeWidth={7} />
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            fontSize:13, fontWeight:800, color:'var(--text)',
          }}>
            {rate}%
          </div>
        </div>
      </div>

      {/* Done / Not done */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr',
        borderTop:'1px solid var(--border-light)',
      }}>
        <div style={{ padding:'5px 8px', textAlign:'center', borderRight:'1px solid var(--border-light)' }}>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Complété</div>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--green-600)' }}>{done}</div>
        </div>
        <div style={{ padding:'5px 8px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Restant</div>
          <div style={{ fontSize:13, fontWeight:800, color: total - done > 0 ? '#ef4444' : 'var(--text-3)' }}>{total - done}</div>
        </div>
      </div>
    </div>
  );
}
