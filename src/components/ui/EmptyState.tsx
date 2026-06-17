import * as React from 'react';
import { classNames } from '@/lib/utils/styles';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, actionLabel, onAction, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex flex-col items-center justify-center p-8 text-center rounded-panel border border-border-subtle bg-surface-panel',
          className
        )}
        {...props}
      >
        {icon && <div className="mb-4 text-text-muted">{icon}</div>}
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-2 text-sm text-text-secondary max-w-sm">{description}</p>}
        {actionLabel && onAction && (
          <div className="mt-6">
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
