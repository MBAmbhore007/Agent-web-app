import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Badge, BadgeProps } from './badge';

export interface AnimatedBadgeProps extends BadgeProps {
  pulse?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  pulse = false,
  className,
  children,
  ...props
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="inline-flex"
    >
      <Badge className={cn('relative', className)} {...props}>
        {pulse && (
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}
        {children}
      </Badge>
    </motion.div>
  );
};

