import { GripHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSidebarStore } from '../../store/sidebar';
import type { SidebarPosition } from '@shared/ipc-types';

const SNAP_PX = 80;

export function DragHandle(): JSX.Element {
	const { position, setPosition } = useSidebarStore();
	const dragging = useRef(false);

	useEffect(() => {
		const onMove = (e: MouseEvent): void => {
			if (!dragging.current) return;

			const gx = window.screenX + e.clientX;
			const gy = window.screenY + e.clientY;
			const sw = window.screen.width;

			let next: SidebarPosition | null = null;
			if (gx <= SNAP_PX) next = 'left';
			else if (gx >= sw - SNAP_PX) next = 'right';
			else if (gy <= SNAP_PX) next = 'top';

			if (next && next !== position) {
				dragging.current = false;
				setPosition(next);
			}
		};

		const onUp = (): void => { dragging.current = false; };

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [position, setPosition]);

	return (
		<div
			onMouseDown={(e) => {
				dragging.current = true;
				e.preventDefault();
			}}
			title="Ziehen um Position zu ändern"
			className="flex items-center justify-center h-7 cursor-grab active:cursor-grabbing hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] transition-colors rounded mx-1 my-1 flex-shrink-0"
		>
			<GripHorizontal size={14} className="text-[#8A8A8A] dark:text-[#6B6B6B]" />
		</div>
	);
}
