import React from 'react';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Dumbbell,
  Gamepad2,
  Leaf,
  Pencil,
  Pin,
  Sparkles,
  Star,
  Sunrise,
  Target,
  Trash2,
} from 'lucide-react';

const ICONS = {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Dumbbell,
  Gamepad2,
  Leaf,
  Pencil,
  Pin,
  Sparkles,
  Star,
  Sunrise,
  Target,
  Trash2,
};

export const getIconComponent = (name) => ICONS[name] || Pin;

export const renderLucideIcon = (name, size = 16, color = 'currentColor') => {
  const Icon = getIconComponent(name);
  return <Icon size={size} color={color} strokeWidth={2} />;
};

export const ACTIVITY_ICON_CHOICES = [
  'BookOpen',
  'Briefcase',
  'Gamepad2',
  'Sunrise',
  'Dumbbell',
  'Pin',
  'Target',
  'Star',
  'CalendarDays',
  'ClipboardList',
];
