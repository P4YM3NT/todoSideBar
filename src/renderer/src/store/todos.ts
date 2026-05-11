import { create } from 'zustand';
import type { Todo } from '@shared/ipc-types';

interface TodoStore {
	todos: Todo[];
	archivedTodos: Todo[];
}

export const useTodoStore = create<TodoStore>(() => ({
	todos: [],
	archivedTodos: [],
}));
