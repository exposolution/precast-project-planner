import { Priority } from '@/types/production';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const labels: Record<Priority, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
  };

  return (
    <span className={cn(
      'priority-badge',
      `priority-${priority}`,
      size === 'sm' && 'text-[10px] px-1.5 py-0.5'
    )}>
      {labels[priority]}
    </span>
  );
}
