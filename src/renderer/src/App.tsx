import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useSidebarStore } from './store/sidebar';
import { useSettingsStore } from './store/settings';
import { invoke } from './store/ipc';

function App(): JSX.Element {
	const { hydrate: hydrateSidebar, setOpen } = useSidebarStore();
	const { setResolvedTheme } = useSettingsStore();

	useEffect(() => {
		hydrateSidebar();

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
				<div className="p-4 flex flex-col gap-2">
					<p className="text-xs text-[#8A8A8A]">Todos kommen hier…</p>
				</div>
			</Sidebar>
		</ErrorBoundary>
	);
}

export default App;
