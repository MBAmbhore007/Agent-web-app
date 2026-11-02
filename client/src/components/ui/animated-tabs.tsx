import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs py-1 px-3',
    md: 'text-xs py-1.5 px-3.5',
    lg: 'text-sm py-2 px-5',
  };

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-2xl bg-slate-100/90 p-1 border border-slate-200/90 shadow-inner select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center space-x-2 font-semibold transition-colors duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              sizeClasses[size],
              isActive ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 rounded-xl bg-white shadow-xs ring-1 ring-slate-200/70"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="shrink-0">{tab.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};
