import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function App(): JSX.Element {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		window.api.invoke('app:getTheme').then((res) => {
			const r = res as { success: boolean; data: Theme };
			if (r.success) applyTheme(r.data);
		});

		const unsubscribe = window.api.on('app:onThemeChange', (data) => {
			applyTheme(data as Theme);
		});

		return unsubscribe;
	}, []);

	function applyTheme(t: Theme): void {
		setTheme(t);
		document.documentElement.classList.toggle('dark', t === 'dark');
	}

	return (
		<div
			className={`h-screen flex flex-col font-sans text-sm ${
				theme === 'dark'
					? 'bg-[#141414] text-[#F0F0F0]'
					: 'bg-[#FFFFFF] text-[#1A1A1A]'
			}`}
		>
			<div className="flex items-center justify-center h-full">
				<p className="text-[#8A8A8A] text-xs">Todo Sidebar lädt…</p>
			</div>
		</div>
	);
}

export default App;
