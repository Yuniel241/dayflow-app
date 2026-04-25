import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import Avatar from './Avatar';
import {
  CalendarDays, ListChecks, BarChart2, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, Zap,
  Sparkles, Heart,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: CalendarDays, label: 'Planning', description: 'Votre semaine' },
  { to: '/dashboard/activities', icon: ListChecks, label: 'Activités', description: 'Gérer vos tâches' },
  { to: '/dashboard/stats', icon: BarChart2, label: 'Statistiques', description: 'Votre progression' },
  { to: '/dashboard/settings', icon: Settings, label: 'Paramètres', description: 'Configuration' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = NAV.find(item => item.to === location.pathname);
  const pageTitle = currentPage?.label || 'Tableau de bord';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 260,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#fff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        zIndex: 50,
      }}>
        {/* Logo Section */}
        <div style={{
          padding: collapsed ? '16px' : '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          overflow: 'hidden',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: 20,
        }}>
          <img
            src={logo}
            alt="DayFlow"
            style={{
              width: 50,
              height: 50,
              borderRadius: 10,
              objectFit: 'contain',
              flexShrink: 0,
              // Le logo a un fond noir — on le retire proprement
              background: '#fff',
              padding: 2,
            }}
          />
          {!collapsed && (
            <div>
              <span style={{
                fontSize: 18,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #166534, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.3,
              }}>DayFlow</span>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, letterSpacing: 1 }}>
                PLAN · FOCUS · GROW
              </div>
            </div>
          )}
        </div>


        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '0 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {NAV.map(({ to, icon: Icon, label, description }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                color: isActive ? '#22c55e' : '#64748b',
                background: isActive ? '#f0fdf4' : 'transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textDecoration: 'none',
                position: 'relative',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? '#22c55e15' : 'transparent',
                  }}>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  {!collapsed && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500 }}>{label}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{description}</div>
                    </div>
                  )}
                  {isActive && !collapsed && (
                    <div style={{
                      width: 3,
                      height: 20,
                      background: '#22c55e',
                      borderRadius: 3,
                      position: 'absolute',
                      right: 0,
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #f1f5f9',
          marginTop: 'auto',
        }}>
          {/* User Info */}
          {!collapsed && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              marginBottom: 12,
              borderRadius: 12,
              background: '#f8fafc',
            }}>
              <Avatar user={user} size={34} />
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: collapsed ? '10px' : '10px 14px',
              borderRadius: 10,
              background: 'transparent',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              marginBottom: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
            {!collapsed && 'Déconnexion'}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%',
              padding: collapsed ? '10px' : '10px 14px',
              borderRadius: 10,
              background: '#f8fafc',
              color: '#64748b',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#22c55e';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && 'Réduire le menu'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <header style={{
          position: 'sticky',
          top: scrolled ? 16 : 0,
          zIndex: 40,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          padding: scrolled ? '12px 24px' : '24px 32px',
          borderBottom: scrolled ? '1px solid rgba(226, 232, 240, 0.5)' : 'none',
          borderRadius: scrolled ? 60 : 0,
          maxWidth: scrolled ? 'calc(100% - 32px)' : '100%',
          margin: scrolled ? '0 16px' : '0',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: scrolled ? '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.02)' : 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <h1 style={{
                fontSize: scrolled ? 20 : 28,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'font-size 0.3s ease'
              }}>
                {pageTitle}
                {pageTitle === 'Tableau de bord' && (
                  <span style={{
                    fontSize: 24,
                    animation: 'wave 1.5s ease-in-out infinite',
                    display: 'inline-block'
                  }}>
                    👋
                  </span>
                )}
              </h1>
              <p style={{
                fontSize: 13,
                color: '#64748b',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap'
              }}>
                Content de te revoir, {user?.name?.split(' ')[0] || 'Ami'}
                <Heart 
                  size={14} 
                  fill="#ef4444"
                  color="#ef4444"
                  style={{ 
                    animation: 'heartBeat 1.5s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.3))',
                    transformOrigin: 'center'
                  }} 
                />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
            
            {/* Pilule Énergie */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#f0fdf4',
              padding: scrolled ? '8px 16px' : '10px 20px',
              borderRadius: 50,
              border: '1px solid #d1fae5',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(34, 197, 94, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#dcfce7';
              e.currentTarget.style.borderColor = '#86efac';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#f0fdf4';
              e.currentTarget.style.borderColor = '#d1fae5';
            }}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <Sparkles size={16} color="#22c55e" strokeWidth={2.5} style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px 32px', flex: 1 }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes heartBeat {
          0%, 100% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.3);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(1);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 1;
            transform: rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: rotate(180deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(20deg);
          }
          75% {
            transform: rotate(-10deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Scrollbar personnalisée */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Animation du contenu principal */
        main {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}