import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useCategoryStore } from '../../store/categories';
import { cn } from '../../lib/cn';

type View = 'todos' | 'archive';

interface Props {
	view: View;
	onViewChange: (v: View) => void;
}

export function CategoryNav({ view, onViewChange }: Props): JSX.Element {
	const { categories, activeId, setActiveId, add, rename, remove } = useCategoryStore();
	const [adding, setAdding] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const addRef = useRef<HTMLInputElement>(null);
	const editRef = useRef<HTMLInputElement>(null);

	function handleAdd(): void {
		setAdding(true);
		setTimeout(() => addRef.current?.focus(), 0);
	}

	function commitAdd(): void {
		const name = addRef.current?.value.trim();
		if (name) add(name);
		setAdding(false);
	}

	function commitEdit(id: string): void {
		const name = editRef.current?.value.trim();
		if (name) rename(id, name);
		setEditingId(null);
	}

	const accent = 'text-[#2563EB] dark:text-[#EAB308]';
	const activeStyle = 'bg-[#F7F7F7] dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#F0F0F0]';
	const inactiveStyle = 'text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E]';

	return (
		<div className="flex flex-col gap-0.5 px-2 pb-2">
			{/* Alle */}
			<button
				onClick={() => { setActiveId(null); onViewChange('todos'); }}
				className={cn(
					'flex items-center gap-2 px-2 py-1.5 rounded-card text-xs w-full text-left transition-colors',
					view === 'todos' && activeId === null ? activeStyle : inactiveStyle,
				)}
			>
				Alle Todos
			</button>

			{/* Kategorien */}
			{categories.map((cat) =>
				editingId === cat.id ? (
					<div key={cat.id} className="flex items-center gap-1 px-2">
						<input
							ref={editRef}
							defaultValue={cat.name}
							onKeyDown={(e) => {
								if (e.key === 'Enter') commitEdit(cat.id);
								if (e.key === 'Escape') setEditingId(null);
							}}
							className="flex-1 text-xs bg-transparent focus:outline-none text-[#1A1A1A] dark:text-[#F0F0F0]"
						/>
						<button onClick={() => commitEdit(cat.id)} className={cn('hover:opacity-70', accent)}><Check size={12} /></button>
						<button onClick={() => setEditingId(null)} className="text-[#8A8A8A] hover:opacity-70"><X size={12} /></button>
					</div>
				) : (
					<div key={cat.id} className="flex items-center group">
						<button
							onClick={() => { setActiveId(cat.id); onViewChange('todos'); }}
							className={cn(
								'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-card text-xs text-left transition-colors',
								view === 'todos' && activeId === cat.id ? activeStyle : inactiveStyle,
							)}
						>
							{cat.name}
						</button>
						<div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1 transition-opacity">
							<button onClick={() => { setEditingId(cat.id); setTimeout(() => editRef.current?.focus(), 0); }} className="text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] p-0.5">
								<Pencil size={11} />
							</button>
							<button onClick={() => remove(cat.id)} className="text-[#8A8A8A] hover:text-red-400 p-0.5">
								<Trash2 size={11} />
							</button>
						</div>
					</div>
				),
			)}

			{/* Neue Kategorie */}
			{adding ? (
				<div className="flex items-center gap-1 px-2 py-1">
					<input
						ref={addRef}
						placeholder="Name…"
						onKeyDown={(e) => {
							if (e.key === 'Enter') commitAdd();
							if (e.key === 'Escape') setAdding(false);
						}}
						onBlur={commitAdd}
						className="flex-1 text-xs bg-transparent focus:outline-none text-[#1A1A1A] dark:text-[#F0F0F0] placeholder:text-[#8A8A8A]"
					/>
				</div>
			) : (
				<button
					onClick={handleAdd}
					className={cn('flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-card w-full transition-colors', inactiveStyle)}
				>
					<Plus size={12} />
					Kategorie
				</button>
			)}

			{/* Divider + Archiv */}
			<div className="border-t border-[#E5E5E5] dark:border-[#2A2A2A] mt-1 pt-1">
				<button
					onClick={() => onViewChange('archive')}
					className={cn(
						'flex items-center gap-2 px-2 py-1.5 rounded-card text-xs w-full text-left transition-colors',
						view === 'archive' ? activeStyle : inactiveStyle,
					)}
				>
					Archiv
				</button>
			</div>
		</div>
	);
}
