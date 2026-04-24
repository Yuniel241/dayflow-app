import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import {
  CalendarDays, ListChecks, BarChart2,
  LogOut, PanelLeftClose, PanelLeftOpen, Zap,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: CalendarDays, label: 'Planning' },
  { to: '/dashboard/activities', icon: ListChecks, label: 'Activités' },
  { to: '/dashboard/stats', icon: BarChart2, label: 'Statistiques' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside style={{
        width: collapsed ? 64 : 220, transition: 'width .25s ease',
        background: '#fff', borderRight: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', padding: '16px 0',
        boxShadow: 'var(--shadow)', position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '8px 16px 24px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          {!collapsed && <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--green-800)', whiteSpace: 'nowrap' }}>DayFlow</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                fontWeight: isActive ? 700 : 500, fontSize: 14,
                color: isActive ? 'var(--green-800)' : 'var(--text-2)',
                background: isActive ? 'var(--green-50)' : 'transparent',
                transition: 'all .15s', whiteSpace: 'nowrap', overflow: 'hidden',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)', marginTop: 8 }}>
          {!collapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 8 }}>
              <Avatar user={user} size={30} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'transparent', color: 'var(--text-3)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', border: 'none',
          }}>
            <LogOut size={15} />{!collapsed && 'Déconnexion'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'transparent', color: 'var(--text-3)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            marginTop: 4, cursor: 'pointer', border: 'none',
          }}>
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            {!collapsed && 'Réduire'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px', overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}