import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export default function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionDisabled = false,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate whitespace-nowrap overflow-hidden">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={actionDisabled} className="w-auto">
          {ActionIcon && <ActionIcon className="w-5 h-5 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
