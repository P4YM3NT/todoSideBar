import { useRef } from 'react';
import { useSidebarStore } from '../../store/sidebar';
import { invoke } from '../../store/ipc';
import { cn } from '../../lib/cn';

export function ResizeHandle(): JSX.Element {
	const { position } = useSidebarStore();
	const startRef = useRef<{ screenX: number; screenY: number; size: number } | null>(null);
	const rafRef = useRef<number | null>(null);
	const pendingSize = useRef<number | null>(null);

	function onMouseDown(e: React.MouseEvent): void {
		e.preventDefault();
		const size = position === 'top' ? window.innerHeight : window.innerWidth;
		startRef.current = { screenX: e.screenX, screenY: e.screenY, size };

		function onMouseMove(ev: MouseEvent): void {
			if (!startRef.current) return;
			const { screenX, screenY, size: startSize } = startRef.current;

			let newSize: number;
			if (position === 'top') {
				newSize = startSize + (ev.screenY - screenY);
			} else if (position === 'right') {
				newSize = startSize + (screenX - ev.screenX);
			} else {
				newSize = startSize + (ev.screenX - screenX);
			}

			pendingSize.current = newSize;
			if (rafRef.current === null) {
				rafRef.current = requestAnimationFrame(() => {
					if (pendingSize.current !== null) {
						invoke('sidebar:resize', { position, size: pendingSize.current }).catch(() => {});
						pendingSize.current = null;
					}
					rafRef.current = null;
				});
			}
		}

		function onMouseUp(): void {
			startRef.current = null;
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	return (
		<div
			onMouseDown={onMouseDown}
			title="Breite anpassen"
			className={cn(
				'absolute z-10 transition-colors duration-150',
				'hover:bg-[#2563EB]/30 dark:hover:bg-[#EAB308]/30',
				position === 'right' && 'top-0 left-[18px] h-full w-1 cursor-col-resize',
				position === 'left'  && 'top-0 right-[18px] h-full w-1 cursor-col-resize',
				position === 'top'   && 'bottom-[18px] left-0 w-full h-1 cursor-row-resize',
			)}
		/>
	);
}
