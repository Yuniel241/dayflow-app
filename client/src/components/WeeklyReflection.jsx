import React, { useState, useEffect } from 'react';
import api from '../api';
import { Award, Clock3, Focus } from 'lucide-react';

export default function WeeklyReflection({ weekStart, reflection, onSaved }) {
  const [data, setData] = useState({ bestWin: '', slowedDown: '', nextFocus: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

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
    { key: 'bestWin', label: 'Meilleure réussite cette semaine', icon: Award, placeholder: "Ex: J'ai terminé mon projet d'IA, j'ai couru 3 fois..." },
    { key: 'slowedDown', label: "Ce qui m'a ralenti", icon: Clock3, placeholder: "Ex: Manque de sommeil, distractions, charge de travail..." },
    { key: 'nextFocus', label: 'Focus de la semaine prochaine', icon: Focus, placeholder: "Ex: Préparer les exams, lancer le prototype..." },
  ];

  return (
    <div style={{
      background: '#fff', 
      borderRadius: 20, 
      padding: isMobile ? '16px' : '24px',
      border: '1px solid #e2e8f0', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #166534, #22c55e)',
        color: '#fff', 
        borderRadius: 12, 
        padding: isMobile ? '10px 16px' : '12px 24px',
        textAlign: 'center', 
        fontWeight: 800, 
        fontSize: isMobile ? 14 : 16,
        marginBottom: 24, 
        letterSpacing: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
      }}>
        <Focus size={isMobile ? 16 : 20} />
        Réflexion hebdomadaire
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div 
            key={key} 
            style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 8 : 16,
              alignItems: isMobile ? 'stretch' : 'flex-start'
            }}
          >
            <div style={{ 
              flex: isMobile ? 'auto' : '0 0 220px',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              paddingTop: isMobile ? 0 : 8
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={isMobile ? 14 : 16} color="#166534" />
              </div>
              <span style={{ 
                fontSize: isMobile ? 13 : 14, 
                fontWeight: 700, 
                color: '#0f172a',
                lineHeight: 1.4
              }}>
                {label}
              </span>
            </div>
            
            <textarea
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
              rows={isMobile ? 3 : 2}
              placeholder={placeholder}
              style={{
                resize: 'vertical',
                padding: '12px 14px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: isMobile ? 13 : 14,
                color: '#0f172a',
                background: '#fafbfc',
                lineHeight: 1.5,
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                width: '100%',
                flex: 1
              }}
              onFocus={e => {
                e.target.style.borderColor = '#22c55e';
                e.target.style.background = '#fff';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = '#fafbfc';
              }}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ 
        marginTop: 24, 
        display: 'flex', 
        justifyContent: 'flex-end',
        borderTop: '1px solid #e2e8f0',
        paddingTop: 20
      }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: isMobile ? '10px 24px' : '10px 32px',
            borderRadius: 40,
            background: saved ? '#22c55e' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            fontWeight: 700,
            fontSize: isMobile ? 13 : 14,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
          }}
          onMouseEnter={e => {
            if (!saving && !saved) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(34,197,94,0.4)';
            }
          }}
          onMouseLeave={e => {
            if (!saving && !saved) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.3)';
            }
          }}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sauvegardé !
            </>
          ) : saving ? (
            <>
              <div style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Sauvegarde...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Sauvegarder
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}