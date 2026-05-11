export type Priority = 'extreme' | 'high' | 'medium' | 'low';

export type Subtask = {
	id: string;
	text: string;
	done: boolean;
	createdAt: number;
};

export type Todo = {
	id: string;
	text: string;
	description?: string;
	links?: string[];
	done: boolean;
	archived: boolean;
	priority: Priority;
	categoryId?: string;
	subtasks: Subtask[];
	dueDate?: number;
	dueTime?: string;
	createdAt: number;
	updatedAt: number;
};

export type Category = {
	id: string;
	name: string;
	createdAt: number;
};

export type SidebarPosition = 'left' | 'right' | 'top';

export type SidebarConfig = {
	position: SidebarPosition;
	isOpen: boolean;
	width: number;
	height: number;
};

export type Settings = {
	theme: 'light' | 'dark' | 'system';
	globalShortcut: string;
};

export type AppState = {
	todos: Todo[];
	categories: Category[];
	sidebar: SidebarConfig;
	settings: Settings;
};

export type IpcResponse<T> = { success: true; data: T } | { success: false; error: string };
