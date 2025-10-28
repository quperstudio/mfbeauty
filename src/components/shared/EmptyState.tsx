import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-8 sm:py-12 px-4 ${className}`}>
      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm sm:text-base text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4 w-full sm:w-auto">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
