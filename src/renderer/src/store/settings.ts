import { create } from 'zustand';

type ResolvedTheme = 'light' | 'dark';

interface SettingsStore {
	resolvedTheme: ResolvedTheme;
	setResolvedTheme: (theme: ResolvedTheme) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
	resolvedTheme: 'light',

	setResolvedTheme: (resolvedTheme) => {
		set({ resolvedTheme });
		document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
	},
}));
