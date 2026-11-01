import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700',
        secondary:
          'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
        destructive:
          'border-transparent bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        outline:
          'text-slate-700 border-slate-200 bg-white hover:bg-slate-50',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
        info:
          'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-1.5 py-0.2 text-[10px] leading-tight',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
