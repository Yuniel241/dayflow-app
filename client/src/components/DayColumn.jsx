import React from 'react';
import { CheckSquare, Square, Clock } from 'lucide-react';
import DonutChart from './DonutChart';
import { getDayShort, formatDate, isToday } from '../utils/dates';

export default function DayColumn({ day, onToggleSlot }) {
  const total = day.slots.length;
  const done = day.slots.filter((s) => s.done).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  const today = isToday(day.date);

  const donutColor =
    rate === 100 ? '#22c55e' :
    rate >= 60  ? '#84cc16' :
    rate >= 30  ? '#f59e0b' : '#ef4444';

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

      {/* ── Header ── */}
      <div style={{
        background: today ? '#22c55e' : '#4a7c59',
        padding: '10px 12px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>
          {getDayShort(day.date)}
          {today && (
            <span style={{
              marginLeft: 6, fontSize: 9,
              background: 'rgba(255,255,255,0.3)',
              padding: '1px 6px', borderRadius: 20,
            }}>
              Aujourd'hui
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
          {formatDate(day.date)}
        </div>
      </div>

      {/* ── Objectif header ── */}
      <div style={{
        padding: '5px 10px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f9fdf8',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .5 }}>
          Tâches
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green-700)' }}>
          {done}/{total}
        </span>
      </div>

      {/* ── Task list avec heures ── */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 260 }}>
        {day.slots.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
            Aucune tâche
          </p>
        )}

        {day.slots.map((slot, i) => {
          const hasTime = slot.startTime && slot.endTime;
          const isLast = i === day.slots.length - 1;

          return (
            <div
              key={i}
              style={{
                borderBottom: isLast ? 'none' : '1px solid #f0f8ef',
                background: slot.done ? '#f9fdf8' : '#fff',
                transition: 'background .15s',
              }}
            >
              {/* Bande horaire */}
              {hasTime && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px 0',
                }}>
                  <Clock size={9} color={slot.done ? '#a3c4a0' : '#7a9a77'} />
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: slot.done ? '#a3c4a0' : '#4a7c59',
                    fontFamily: 'Space Mono, monospace',
                    letterSpacing: .3,
                  }}>
                    {slot.startTime} – {slot.endTime}
                  </span>
                  {/* Durée */}
                  <span style={{
                    fontSize: 9, color: '#b0c8ae',
                    marginLeft: 2,
                  }}>
                    ({slot.duration}min)
                  </span>
                </div>
              )}

              {/* Ligne checkbox + nom */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: hasTime ? '3px 8px 6px' : '6px 8px',
                cursor: 'pointer',
              }}>
                {/* Couleur de catégorie */}
                <div style={{
                  width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                  background: slot.color || '#4ade80',
                  opacity: slot.done ? 0.4 : 1,
                }} />

                <button
                  onClick={() => onToggleSlot(day.date, i, !slot.done)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    cursor: 'pointer', flexShrink: 0, display: 'flex',
                    color: slot.done ? '#22c55e' : '#d4e8cd',
                    transition: 'color .15s',
                  }}
                >
                  {slot.done
                    ? <CheckSquare size={14} color="#22c55e" />
                    : <Square size={14} color="#d4e8cd" />
                  }
                </button>

                <span style={{
                  fontSize: 11, lineHeight: 1.3, flex: 1,
                  color: slot.done ? 'var(--text-3)' : 'var(--text)',
                  textDecoration: slot.done ? 'line-through' : 'none',
                  textDecorationColor: '#a3c4a0',
                }}>
                  {slot.emoji} {slot.activityName}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {/* ── Donut ── */}
      <div style={{
        padding: '10px 0 6px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <DonutChart percent={rate} size={64} color={donutColor} strokeWidth={6} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 12, fontWeight: 800, color: 'var(--text)',
            fontFamily: 'Space Mono, monospace',
          }}>
            {rate}%
          </div>
        </div>
      </div>

      {/* ── Footer complété / restant ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .3 }}>Fait</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>{done}</div>
        </div>
        <div style={{ padding: '5px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .3 }}>Reste</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: total - done > 0 ? '#ef4444' : 'var(--text-3)' }}>
            {total - done}
          </div>
        </div>
      </div>
    </div>
  );
}