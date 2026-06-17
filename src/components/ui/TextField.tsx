import * as React from 'react';
import { classNames } from '@/lib/utils/styles';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, helperText, fullWidth = true, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={classNames('flex flex-col gap-1.5', fullWidth ? 'w-full' : '', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={classNames(
            'px-3 py-2 text-sm border rounded-input bg-surface-panel outline-none transition-shadow',
            'focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-500 text-red-900'
              : 'border-border-subtle focus:ring-brand-500 focus:border-brand-500 text-text-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-muted',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
