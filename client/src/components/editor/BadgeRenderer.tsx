import React from 'react';
import {
  Bell,
  Flame,
  Plus,
  Heart,
  Sparkles,
  CheckCircle2,
  ArrowDown,
  Clock,
  Star,
  Zap,
} from 'lucide-react';

export interface BadgeDefinition {
  key: string;
  label: string;
  subLabel?: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ElementType;
}

export const SOCIAL_BADGES: BadgeDefinition[] = [
  {
    key: 'subscribe',
    label: 'SUBSCRIBE',
    subLabel: '🔔',
    bgClass: 'bg-red-600',
    textClass: 'text-white',
    borderClass: 'border-red-400/40',
    icon: Bell,
  },
  {
    key: 'trending',
    label: 'TRENDING',
    subLabel: '🔥',
    bgClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textClass: 'text-white',
    borderClass: 'border-amber-300/40',
    icon: Flame,
  },
  {
    key: 'follow',
    label: 'FOLLOW',
    subLabel: '+',
    bgClass: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700',
    textClass: 'text-white',
    borderClass: 'border-purple-300/40',
    icon: Plus,
  },
  {
    key: 'like',
    label: 'LIKE & SHARE',
    subLabel: '❤️',
    bgClass: 'bg-gradient-to-r from-rose-500 to-pink-600',
    textClass: 'text-white',
    borderClass: 'border-rose-300/40',
    icon: Heart,
  },
  {
    key: 'sound_on',
    label: 'SOUND ON',
    subLabel: '🔊',
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
    borderClass: 'border-emerald-300/40',
    icon: Sparkles,
  },
  {
    key: 'verified',
    label: 'VERIFIED',
    subLabel: '✓',
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
    borderClass: 'border-blue-300/40',
    icon: CheckCircle2,
  },
  {
    key: 'wait_till_end',
    label: 'WAIT TILL END',
    subLabel: '⏳',
    bgClass: 'bg-zinc-900',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-400/40',
    icon: Clock,
  },
  {
    key: 'part_2',
    label: 'PART 2',
    subLabel: '👇',
    bgClass: 'bg-purple-900',
    textClass: 'text-white',
    borderClass: 'border-purple-400/40',
    icon: ArrowDown,
  },
  {
    key: 'viral_hit',
    label: 'VIRAL HIT',
    subLabel: '⚡',
    bgClass: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500',
    textClass: 'text-zinc-950 font-black',
    borderClass: 'border-yellow-300/60',
    icon: Zap,
  },
  {
    key: 'new_drop',
    label: 'NEW DROP',
    subLabel: '⭐',
    bgClass: 'bg-cyan-500',
    textClass: 'text-zinc-950 font-black',
    borderClass: 'border-cyan-300/50',
    icon: Star,
  },
];

interface BadgeRendererProps {
  badgeKey: string;
  label?: string;
  className?: string;
}

export const BadgeRenderer: React.FC<BadgeRendererProps> = ({
  badgeKey,
  label,
  className = '',
}) => {
  const badgeDef =
    SOCIAL_BADGES.find((b) => b.key === badgeKey || b.label === label) || {
      key: 'custom',
      label: label || badgeKey,
      subLabel: '',
      bgClass: 'bg-purple-600',
      textClass: 'text-white',
      borderClass: 'border-purple-300/40',
      icon: Sparkles,
    };

  const IconComponent = badgeDef.icon;
  const displayLabel = label || badgeDef.label;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-xs select-none transition-transform ${badgeDef.bgClass} ${badgeDef.textClass} ${badgeDef.borderClass} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0 filter drop-shadow" />
      <span className="text-xs font-black tracking-wider uppercase whitespace-nowrap drop-shadow">
        {displayLabel}
      </span>
      {badgeDef.subLabel && (
        <span className="text-xs shrink-0 select-none ml-0.5">{badgeDef.subLabel}</span>
      )}
    </div>
  );
};
