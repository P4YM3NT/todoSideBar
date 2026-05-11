import { useState } from 'react';
import { ChevronDown, ChevronUp, Link, Pencil } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { PriorityBadge } from './PriorityBadge';
import { SubtaskList } from './SubtaskList';
import { TodoForm } from './TodoForm';
import { useTodoStore } from '../../store/todos';
import { cn } from '../../lib/cn';
import type { Todo } from '@shared/ipc-types';

interface Props {
	todo: Todo;
}

function formatDue(ts: number, time?: string): string {
	const d = new Date(ts);
	const today = new Date();
	const isToday = d.toDateString() === today.toDateString();
	const date = isToday ? 'Heute' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	return time ? `${date} ${time}` : date;
}

export function TodoItem({ todo }: Props): JSX.Element {
	const { archive } = useTodoStore();
	const [expanded, setExpanded] = useState(false);
	const [editing, setEditing] = useState(false);

	const hasDetails = todo.description || (todo.links?.length ?? 0) > 0 || todo.subtasks.length > 0;
	const doneSubtasks = todo.subtasks.filter((s) => s.done).length;
	const isOverdue = todo.dueDate && todo.dueDate < Date.now() && !todo.done;

	if (editing) {
		return <TodoForm todo={todo} onClose={() => setEditing(false)} />;
	}

	return (
		<div className="group flex flex-col gap-0 py-1.5 px-2 rounded-card hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] transition-colors">
			{/* Hauptzeile */}
			<div className="flex items-start gap-2">
				<div className="mt-0.5">
					<Checkbox checked={todo.done} onChange={() => archive(todo.id)} />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5">
						<PriorityBadge priority={todo.priority} />
						<span className={cn('text-sm leading-snug truncate', todo.done && 'line-through text-[#8A8A8A] dark:text-[#6B6B6B]')}>
							{todo.text}
						</span>
					</div>

					{/* Meta-Zeile */}
					<div className="flex items-center gap-2 mt-0.5">
						{todo.dueDate && (
							<span className={cn('text-[10px]', isOverdue ? 'text-red-400' : 'text-[#8A8A8A] dark:text-[#6B6B6B]')}>
								{formatDue(todo.dueDate, todo.dueTime)}
							</span>
						)}
						{todo.subtasks.length > 0 && (
							<span className="text-[10px] text-[#8A8A8A] dark:text-[#6B6B6B]">
								{doneSubtasks}/{todo.subtasks.length}
							</span>
						)}
						{(todo.links?.length ?? 0) > 0 && (
							<Link size={10} className="text-[#8A8A8A] dark:text-[#6B6B6B]" />
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
					<button onClick={() => setEditing(true)} className="p-1 text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0]">
						<Pencil size={12} />
					</button>
					{hasDetails && (
						<button onClick={() => setExpanded((v) => !v)} className="p-1 text-[#8A8A8A]">
							{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
						</button>
					)}
				</div>
			</div>

			{/* Expanded Details */}
			{expanded && (
				<div className="ml-6 mt-1 flex flex-col gap-1.5">
					{todo.description && (
						<p className="text-xs text-[#8A8A8A] dark:text-[#6B6B6B] whitespace-pre-wrap">{todo.description}</p>
					)}
					{(todo.links?.length ?? 0) > 0 && (
						<div className="flex flex-col gap-0.5">
							{todo.links!.map((l) => (
								<a
									key={l}
									href={l}
									target="_blank"
									rel="noreferrer"
									className="text-[10px] text-[#2563EB] dark:text-[#EAB308] truncate hover:underline"
								>
									{l}
								</a>
							))}
						</div>
					)}
					{todo.subtasks.length > 0 && (
						<SubtaskList todoId={todo.id} subtasks={todo.subtasks} />
					)}
				</div>
			)}
		</div>
	);
}
