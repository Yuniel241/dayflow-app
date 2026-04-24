const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  return toLocalISODate(d);
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getDayName = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
};

export const getDayShort = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();
};

export const isToday = (dateStr) => {
  return dateStr === toLocalISODate(new Date());
};

export const addWeeks = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n * 7);
  return toLocalISODate(d);
};

export const getWeekLabel = (weekStart) => {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

export const CATEGORY_COLORS = {
  études: '#4ade80',
  loisirs: '#60a5fa',
  projet: '#a78bfa',
  routine: '#fbbf24',
  sport: '#f87171',
  autre: '#94a3b8',
};

export const CATEGORY_ICONS = {
  études: 'BookOpen',
  loisirs: 'Gamepad2',
  projet: 'Briefcase',
  routine: 'Sunrise',
  sport: 'Dumbbell',
  autre: 'Pin',
};
