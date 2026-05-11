import { cn } from '../../lib/cn';
import type { Priority } from '@shared/ipc-types';

const CONFIG: Record<Priority, { label: string; dot: string }> = {
	extreme: { label: 'Extrem',  dot: 'bg-red-500' },
	high:    { label: 'Hoch',    dot: 'bg-orange-400' },
	medium:  { label: 'Mittel',  dot: 'bg-[#2563EB] dark:bg-[#EAB308]' },
	low:     { label: 'Niedrig', dot: 'bg-transparent' },
};

interface Props {
	priority: Priority;
	showLabel?: boolean;
	className?: string;
}

export function PriorityBadge({ priority, showLabel = false, className }: Props): JSX.Element | null {
	if (priority === 'low') return null;
	const { label, dot } = CONFIG[priority];

	return (
		<span className={cn('inline-flex items-center gap-1', className)}>
			<span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dot)} />
			{showLabel && (
				<span className="text-[10px] text-[#8A8A8A] dark:text-[#6B6B6B]">{label}</span>
			)}
		</span>
	);
}
