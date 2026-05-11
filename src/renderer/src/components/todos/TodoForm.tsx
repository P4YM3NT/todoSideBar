import { useState } from 'react';
import { X, Link, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTodoStore } from '../../store/todos';
import { useCategoryStore } from '../../store/categories';
import { cn } from '../../lib/cn';
import type { Priority, Todo } from '@shared/ipc-types';

const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
	{ value: 'extreme', label: 'Extrem', dot: 'bg-red-500' },
	{ value: 'high',    label: 'Hoch',   dot: 'bg-orange-400' },
	{ value: 'medium',  label: 'Mittel', dot: 'bg-[#2563EB] dark:bg-[#EAB308]' },
	{ value: 'low',     label: 'Niedrig',dot: 'bg-[#E5E5E5] dark:bg-[#2A2A2A]' },
];

interface Props {
	todo?: Todo;
	onClose: () => void;
}

export function TodoForm({ todo, onClose }: Props): JSX.Element {
	const { add, update } = useTodoStore();
	const { categories, activeId } = useCategoryStore();
	const isEditing = !!todo;

	const [text, setText] = useState(todo?.text ?? '');
	const [description, setDescription] = useState(todo?.description ?? '');
	const [priority, setPriority] = useState<Priority>(todo?.priority ?? 'medium');
	const [categoryId, setCategoryId] = useState<string | undefined>(todo?.categoryId ?? activeId ?? undefined);
	const [dueDate, setDueDate] = useState(
		todo?.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
	);
	const [dueTime, setDueTime] = useState(todo?.dueTime ?? '');
	const [linkInput, setLinkInput] = useState('');
	const [links, setLinks] = useState<string[]>(todo?.links ?? []);
	function addLink(): void {
		const url = linkInput.trim();
		if (url && !links.includes(url)) setLinks([...links, url]);
		setLinkInput('');
	}

	async function handleSubmit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		if (!text.trim()) return;

		const dueDateTs = dueDate ? new Date(dueDate).getTime() : undefined;

		if (isEditing) {
			await update(todo.id, {
				text: text.trim(),
				description: description.trim() || undefined,
				links: links.length ? links : undefined,
				priority,
				categoryId,
				dueDate: dueDateTs,
				dueTime: dueTime || undefined,
			});
		} else {
			await add({
				text: text.trim(),
				description: description.trim() || undefined,
				links: links.length ? links : undefined,
				priority,
				categoryId,
				dueDate: dueDateTs,
				dueTime: dueTime || undefined,
			});
		}
		onClose();
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 bg-[#F7F7F7] dark:bg-[#1E1E1E] rounded-card">
			{/* Text */}
			<input
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Todo…"
				autoFocus
				className="w-full bg-transparent text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:outline-none"
			/>

			{/* Beschreibung */}
			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				placeholder="Beschreibung (optional)…"
				rows={2}
				className="w-full bg-transparent text-xs text-[#8A8A8A] placeholder:text-[#8A8A8A] focus:outline-none resize-none"
			/>

			{/* Priorität */}
			<div className="flex items-center gap-1.5 flex-wrap">
				{PRIORITIES.map((p) => (
					<button
						key={p.value}
						type="button"
						onClick={() => setPriority(p.value)}
						className={cn(
							'flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] border transition-colors',
							priority === p.value
								? 'border-[#2563EB] dark:border-[#EAB308] text-[#2563EB] dark:text-[#EAB308]'
								: 'border-[#E5E5E5] dark:border-[#2A2A2A] text-[#8A8A8A]',
						)}
					>
						<span className={cn('w-1.5 h-1.5 rounded-full', p.dot)} />
						{p.label}
					</button>
				))}
			</div>

			{/* Kategorie */}
			{categories.length > 0 && (
				<select
					value={categoryId ?? ''}
					onChange={(e) => setCategoryId(e.target.value || undefined)}
					className="text-xs bg-transparent border border-[#E5E5E5] dark:border-[#2A2A2A] rounded-input px-2 py-1 text-[#8A8A8A] focus:outline-none"
				>
					<option value="">Keine Kategorie</option>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>{c.name}</option>
					))}
				</select>
			)}

			{/* Datum + Uhrzeit */}
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1 flex-1">
					<Calendar size={12} className="text-[#8A8A8A]" />
					<input
						type="date"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						className="text-xs bg-transparent text-[#8A8A8A] focus:outline-none flex-1"
					/>
				</div>
				{dueDate && (
					<div className="flex items-center gap-1">
						<Clock size={12} className="text-[#8A8A8A]" />
						<input
							type="time"
							value={dueTime}
							onChange={(e) => setDueTime(e.target.value)}
							className="text-xs bg-transparent text-[#8A8A8A] focus:outline-none"
						/>
					</div>
				)}
			</div>

			{/* Links */}
			<div className="flex flex-col gap-1">
				{links.map((l) => (
					<div key={l} className="flex items-center gap-1 text-[10px] text-[#2563EB] dark:text-[#EAB308]">
						<Link size={10} />
						<span className="flex-1 truncate">{l}</span>
						<button type="button" onClick={() => setLinks(links.filter((x) => x !== l))}>
							<X size={10} className="text-[#8A8A8A]" />
						</button>
					</div>
				))}
				<div className="flex gap-1">
					<input
						value={linkInput}
						onChange={(e) => setLinkInput(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
						placeholder="Link hinzufügen…"
						className="flex-1 text-[10px] bg-transparent text-[#8A8A8A] placeholder:text-[#8A8A8A] focus:outline-none"
					/>
					{linkInput && <button type="button" onClick={addLink} className="text-[10px] text-[#2563EB] dark:text-[#EAB308]">+</button>}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E5E5E5] dark:border-[#2A2A2A]">
				<Button type="button" variant="ghost" size="sm" onClick={onClose}>Abbrechen</Button>
				<Button type="submit" variant="primary" size="sm" disabled={!text.trim()}>
					{isEditing ? 'Speichern' : 'Hinzufügen'}
				</Button>
			</div>
		</form>
	);
}
