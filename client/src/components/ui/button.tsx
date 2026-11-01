import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
        outline:
          'border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100',
        secondary:
          'bg-slate-100 text-slate-800 shadow-2xs hover:bg-slate-200 active:bg-slate-300',
        ghost:
          'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link:
          'text-emerald-600 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        subtle:
          'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 active:bg-emerald-200',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {!loading && leftIcon && <span className="mr-1.5 inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-1.5 inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
