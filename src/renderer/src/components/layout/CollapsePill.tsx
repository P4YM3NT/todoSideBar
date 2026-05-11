import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useSidebarStore } from '../../store/sidebar';
import { cn } from '../../lib/cn';

const ICON_MAP = {
	right:  { open: ChevronRight, closed: ChevronLeft },
	left:   { open: ChevronLeft,  closed: ChevronRight },
	top:    { open: ChevronUp,    closed: ChevronDown },
};

export function CollapsePill(): JSX.Element {
	const { position, isOpen, toggle } = useSidebarStore();
	const Icon = ICON_MAP[position][isOpen ? 'open' : 'closed'];
	const isVertical = position !== 'top';

	return (
		<button
			onClick={toggle}
			aria-label={isOpen ? 'Sidebar schließen' : 'Sidebar öffnen'}
			className={cn(
				'absolute z-20 flex items-center justify-center',
				'hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] transition-colors duration-150',
				'focus:outline-none',
				isVertical  && 'top-0 bottom-0 w-[18px]',
				!isVertical && 'left-0 right-0 h-[18px]',
				position === 'right' && 'left-0',
				position === 'left'  && 'right-0',
				position === 'top'   && 'bottom-0',
			)}
		>
			<div
				className={cn(
					'flex items-center justify-center',
					'bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-pill',
					isVertical  ? 'w-[14px] h-[40px]' : 'h-[14px] w-[40px]',
				)}
			>
				<Icon size={10} className="text-[#8A8A8A] dark:text-[#6B6B6B]" />
			</div>
		</button>
	);
}
