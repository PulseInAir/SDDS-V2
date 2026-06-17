import * as React from 'react';
import { classNames } from '@/lib/utils/styles';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      neutral: 'bg-surface-muted text-text-secondary border border-border-subtle',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-brand-100 text-brand-800 border border-brand-200',
    };

    return (
      <span
        ref={ref}
        className={classNames(
          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
