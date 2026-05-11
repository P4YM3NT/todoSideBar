import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TodoItem } from './TodoItem';
import { TodoForm } from './TodoForm';
import { useTodoStore } from '../../store/todos';
import { useCategoryStore } from '../../store/categories';

export function TodoList(): JSX.Element {
	const { todos } = useTodoStore();
	const { activeId } = useCategoryStore();
	const [showForm, setShowForm] = useState(false);

	const filtered = activeId
		? todos.filter((t) => t.categoryId === activeId)
		: todos;

	return (
		<div className="flex flex-col flex-1">
			{/* Todo-Items */}
			<div className="flex flex-col px-1">
				{filtered.length === 0 && !showForm && (
					<p className="text-xs text-[#8A8A8A] dark:text-[#6B6B6B] px-2 py-4 text-center">
						Noch keine Todos
					</p>
				)}
				{filtered.map((todo) => (
					<TodoItem key={todo.id} todo={todo} />
				))}
			</div>

			{/* Add-Formular oder Button */}
			<div className="px-2 py-1 mt-1">
				{showForm ? (
					<TodoForm onClose={() => setShowForm(false)} />
				) : (
					<button
						onClick={() => setShowForm(true)}
						className="flex items-center gap-2 w-full px-2 py-2 text-xs text-[#8A8A8A] hover:text-[#2563EB] dark:hover:text-[#EAB308] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] rounded-card transition-colors"
					>
						<Plus size={14} />
						Todo hinzufügen
					</button>
				)}
			</div>
		</div>
	);
}
