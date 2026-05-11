import { create } from 'zustand';
import { invoke } from './ipc';
import type { Todo, Subtask, Priority } from '@shared/ipc-types';

function uuid(): string {
	return crypto.randomUUID();
}

function now(): number {
	return Date.now();
}

interface TodoStore {
	todos: Todo[];
	archivedTodos: Todo[];
	isHydrated: boolean;
	hydrate: () => Promise<void>;
	add: (data: { text: string; description?: string; links?: string[]; priority: Priority; categoryId?: string; dueDate?: number; dueTime?: string }) => Promise<void>;
	update: (id: string, changes: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
	archive: (id: string) => Promise<void>;
	restore: (id: string) => Promise<void>;
	deletePermanently: (id: string) => Promise<void>;
	addSubtask: (todoId: string, text: string) => Promise<void>;
	toggleSubtask: (todoId: string, subtaskId: string) => Promise<void>;
	deleteSubtask: (todoId: string, subtaskId: string) => Promise<void>;
}

async function persist(todos: Todo[], archivedTodos: Todo[]): Promise<void> {
	await invoke('store:set', { todos, archivedTodos } as never);
}

export const useTodoStore = create<TodoStore>((set, get) => ({
	todos: [],
	archivedTodos: [],
	isHydrated: false,

	hydrate: async () => {
		const state = await invoke('store:get');
		set({
			todos: (state as { todos?: Todo[]; archivedTodos?: Todo[] }).todos ?? [],
			archivedTodos: (state as { todos?: Todo[]; archivedTodos?: Todo[] }).archivedTodos ?? [],
			isHydrated: true,
		});
	},

	add: async (data) => {
		const todo: Todo = {
			id: uuid(),
			text: data.text,
			description: data.description,
			links: data.links,
			done: false,
			archived: false,
			priority: data.priority,
			categoryId: data.categoryId,
			subtasks: [],
			dueDate: data.dueDate,
			dueTime: data.dueTime,
			createdAt: now(),
			updatedAt: now(),
		};
		const todos = [...get().todos, todo];
		set({ todos });
		await persist(todos, get().archivedTodos);
	},

	update: async (id, changes) => {
		const todos = get().todos.map((t) =>
			t.id === id ? { ...t, ...changes, updatedAt: now() } : t,
		);
		set({ todos });
		await persist(todos, get().archivedTodos);
	},

	archive: async (id) => {
		const todo = get().todos.find((t) => t.id === id);
		if (!todo) return;
		const todos = get().todos.filter((t) => t.id !== id);
		const archivedTodos = [...get().archivedTodos, { ...todo, done: true, archived: true, updatedAt: now() }];
		set({ todos, archivedTodos });
		await persist(todos, archivedTodos);
	},

	restore: async (id) => {
		const todo = get().archivedTodos.find((t) => t.id === id);
		if (!todo) return;
		const archivedTodos = get().archivedTodos.filter((t) => t.id !== id);
		const todos = [...get().todos, { ...todo, done: false, archived: false, updatedAt: now() }];
		set({ todos, archivedTodos });
		await persist(todos, archivedTodos);
	},

	deletePermanently: async (id) => {
		const archivedTodos = get().archivedTodos.filter((t) => t.id !== id);
		set({ archivedTodos });
		await persist(get().todos, archivedTodos);
	},

	addSubtask: async (todoId, text) => {
		const subtask: Subtask = { id: uuid(), text, done: false, createdAt: now() };
		const todos = get().todos.map((t) =>
			t.id === todoId
				? { ...t, subtasks: [...t.subtasks, subtask], updatedAt: now() }
				: t,
		);
		set({ todos });
		await persist(todos, get().archivedTodos);
	},

	toggleSubtask: async (todoId, subtaskId) => {
		const todos = get().todos.map((t) =>
			t.id === todoId
				? {
						...t,
						subtasks: t.subtasks.map((s) =>
							s.id === subtaskId ? { ...s, done: !s.done } : s,
						),
						updatedAt: now(),
					}
				: t,
		);
		set({ todos });
		await persist(todos, get().archivedTodos);
	},

	deleteSubtask: async (todoId, subtaskId) => {
		const todos = get().todos.map((t) =>
			t.id === todoId
				? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId), updatedAt: now() }
				: t,
		);
		set({ todos });
		await persist(todos, get().archivedTodos);
	},
}));
