import { useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { useTodoStore } from '../../store/todos';
import type { Subtask } from '@shared/ipc-types';

interface Props {
	todoId: string;
	subtasks: Subtask[];
}

export function SubtaskList({ todoId, subtasks }: Props): JSX.Element {
	const { toggleSubtask, deleteSubtask, addSubtask } = useTodoStore();
	const [adding, setAdding] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	function startAdding(): void {
		setAdding(true);
		setTimeout(() => inputRef.current?.focus(), 0);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.key === 'Enter') {
			const text = inputRef.current?.value.trim();
			if (text) {
				addSubtask(todoId, text);
				if (inputRef.current) inputRef.current.value = '';
			}
		}
		if (e.key === 'Escape') setAdding(false);
	}

	return (
		<div className="mt-2 flex flex-col gap-1">
			{subtasks.map((s) => (
				<div key={s.id} className="flex items-center gap-2 group">
					<Checkbox checked={s.done} onChange={() => toggleSubtask(todoId, s.id)} />
					<span className={`flex-1 text-xs ${s.done ? 'line-through text-[#8A8A8A] dark:text-[#6B6B6B]' : 'text-[#1A1A1A] dark:text-[#F0F0F0]'}`}>
						{s.text}
					</span>
					<button
						onClick={() => deleteSubtask(todoId, s.id)}
						className="opacity-0 group-hover:opacity-100 text-[#8A8A8A] hover:text-red-400 transition-opacity"
					>
						<Trash2 size={11} />
					</button>
				</div>
			))}

			{adding && (
				<div className="flex items-center gap-2">
					<span className="w-4 h-4 flex-shrink-0" />
					<input
						ref={inputRef}
						placeholder="Subtask…"
						onKeyDown={handleKeyDown}
						onBlur={() => setAdding(false)}
						className="flex-1 text-xs bg-transparent focus:outline-none text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#8A8A8A]"
					/>
				</div>
			)}

			<button
				onClick={startAdding}
				className="flex items-center gap-1.5 text-[10px] text-[#8A8A8A] hover:text-[#2563EB] dark:hover:text-[#EAB308] transition-colors mt-0.5 w-fit"
			>
				<Plus size={11} />
				Subtask
			</button>
		</div>
	);
}
