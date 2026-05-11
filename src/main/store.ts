import Store from 'electron-store';
import type { AppState } from '../shared/ipc-types';

const defaults: AppState = {
	todos: [],
	archivedTodos: [],
	categories: [],
	sidebar: {
		position: 'right',
		isOpen: true,
		width: 320,
		height: 280,
	},
	settings: {
		theme: 'system',
		globalShortcut: 'CommandOrControl+Shift+T',
	},
};

const store = new Store<AppState>({
	name: 'app-state',
	defaults,
});

export default store;
