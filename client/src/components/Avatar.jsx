import React, { useMemo } from 'react';
import {
  Cat, Dog, Bird, Fish, Rabbit, Squirrel, Turtle, Bug,
  Ghost, Star, Flame, Leaf, Flower, Sun, Moon, Cloud,
  Zap, Heart, Diamond, Hexagon,
} from 'lucide-react';

const ICONS = [
  Cat, Dog, Bird, Fish, Rabbit, Squirrel, Turtle, Bug,
  Ghost, Star, Flame, Leaf, Flower, Sun, Moon, Cloud,
  Zap, Heart, Diamond, Hexagon,
];

const BG_COLORS = [
  '#bbf7d0', '#bfdbfe', '#fde68a', '#fecdd3', '#ddd6fe',
  '#fed7aa', '#cffafe', '#d9f99d', '#fce7f3', '#e0e7ff',
];

// Choisit un icône + couleur de manière déterministe selon le jour
const getDailyAvatar = (userId = '') => {
  const seed = userId.charCodeAt(0) + new Date().getDate() + new Date().getMonth();
  const IconComponent = ICONS[seed % ICONS.length];
  const bg = BG_COLORS[seed % BG_COLORS.length];
  return { IconComponent, bg };
};

export default function Avatar({ user, size = 36 }) {
  const { IconComponent, bg } = useMemo(() => getDailyAvatar(user?._id || ''), [user?._id]);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconComponent size={Math.round(size * 0.5)} color="#374151" strokeWidth={1.8} />
    </div>
  );
}