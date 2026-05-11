import type { ReactNode } from 'react';
import { CollapsePill } from './CollapsePill';
import { DragHandle } from './DragHandle';
import { useSidebarStore } from '../../store/sidebar';
import { cn } from '../../lib/cn';

interface Props {
	children: ReactNode;
}

export function Sidebar({ children }: Props): JSX.Element {
	const { position, isOpen } = useSidebarStore();

	return (
		<div className="h-screen overflow-hidden relative bg-white dark:bg-[#141414] text-[#1A1A1A] dark:text-[#F0F0F0] font-sans text-sm">
			<CollapsePill />

			{isOpen && (
				<div
					className={cn(
						'h-full flex flex-col overflow-hidden',
						position === 'right' && 'ml-[18px]',
						position === 'left'  && 'mr-[18px]',
						position === 'top'   && 'mb-[18px]',
					)}
				>
					<DragHandle />

					<div className="flex-1 overflow-y-auto overflow-x-hidden">
						{children}
					</div>
				</div>
			)}
		</div>
	);
}
