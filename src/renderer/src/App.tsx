import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { CategoryNav } from './components/navigation/CategoryNav';
import { TodoList } from './components/todos/TodoList';
import { ArchiveView } from './components/navigation/ArchiveView';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useSidebarStore } from './store/sidebar';
import { useSettingsStore } from './store/settings';
import { useTodoStore } from './store/todos';
import { useCategoryStore } from './store/categories';
import { invoke } from './store/ipc';

type View = 'todos' | 'archive';

function App(): JSX.Element {
	const { hydrate: hydrateSidebar, setOpen } = useSidebarStore();
	const { setResolvedTheme } = useSettingsStore();
	const { hydrate: hydrateTodos } = useTodoStore();
	const { hydrate: hydrateCategories } = useCategoryStore();
	const [view, setView] = useState<View>('todos');

	useEffect(() => {
		hydrateSidebar();
		hydrateTodos();
		hydrateCategories();

		invoke('app:getTheme').then((theme) => setResolvedTheme(theme));

		const unsubTheme = window.api.on('app:onThemeChange', (data) => {
			setResolvedTheme(data as 'light' | 'dark');
		});

		const unsubToggle = window.api.on('sidebar:toggleFromMain', (data) => {
			setOpen(data as boolean);
		});

		return () => {
			unsubTheme();
			unsubToggle();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<ErrorBoundary>
			<Sidebar>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="px-3 pt-3 pb-2 border-b border-[#E5E5E5] dark:border-[#2A2A2A] flex-shrink-0">
						<h1 className="text-md font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] tracking-tight">
							Todos
						</h1>
					</div>

					{/* Navigation */}
					<div className="pt-2 flex-shrink-0">
						<CategoryNav view={view} onViewChange={setView} />
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto overflow-x-hidden">
						<ErrorBoundary>
							{view === 'todos' ? <TodoList /> : <ArchiveView />}
						</ErrorBoundary>
					</div>
				</div>
			</Sidebar>
		</ErrorBoundary>
	);
}

export default App;
