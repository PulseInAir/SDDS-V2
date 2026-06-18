import * as React from 'react';
import { classNames } from '@/lib/utils/styles';

export type LoadingSkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames('rounded bg-surface-muted motion-safe:animate-pulse', className)}
        {...props}
      />
    );
  }
);

LoadingSkeleton.displayName = 'LoadingSkeleton';
