import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    success: 'bg-success-100 text-success-800 border-success-200 dark:bg-success-900 dark:text-success-200 dark:border-success-800',
    error: 'bg-error-100 text-error-800 border-error-200 dark:bg-error-900 dark:text-error-200 dark:border-error-800',
    warning: 'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900 dark:text-warning-200 dark:border-warning-800',
    info: 'bg-info-100 text-info-800 border-info-200 dark:bg-info-900 dark:text-info-200 dark:border-info-800',
    purple: 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900 dark:text-primary-200 dark:border-primary-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
