import { RotateCcw, Trash2 } from 'lucide-react';
import { useTodoStore } from '../../store/todos';
import { PriorityBadge } from '../todos/PriorityBadge';

export function ArchiveView(): JSX.Element {
	const { archivedTodos, restore, deletePermanently } = useTodoStore();

	if (archivedTodos.length === 0) {
		return (
			<p className="text-xs text-[#8A8A8A] dark:text-[#6B6B6B] px-4 py-4 text-center">
				Archiv ist leer
			</p>
		);
	}

	return (
		<div className="flex flex-col px-1">
			{archivedTodos.map((todo) => (
				<div key={todo.id} className="group flex items-start gap-2 py-1.5 px-2 rounded-card hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] transition-colors">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5">
							<PriorityBadge priority={todo.priority} />
							<span className="text-sm line-through text-[#8A8A8A] dark:text-[#6B6B6B] truncate">
								{todo.text}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
						<button
							onClick={() => restore(todo.id)}
							title="Wiederherstellen"
							className="p-1 text-[#8A8A8A] hover:text-[#2563EB] dark:hover:text-[#EAB308]"
						>
							<RotateCcw size={12} />
						</button>
						<button
							onClick={() => deletePermanently(todo.id)}
							title="Endgültig löschen"
							className="p-1 text-[#8A8A8A] hover:text-red-400"
						>
							<Trash2 size={12} />
						</button>
					</div>
				</div>
			))}
		</div>
	);
}
