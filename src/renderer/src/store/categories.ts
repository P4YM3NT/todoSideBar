import { create } from 'zustand';
import { invoke } from './ipc';
import type { Category } from '@shared/ipc-types';

function uuid(): string {
	return crypto.randomUUID();
}

interface CategoryStore {
	categories: Category[];
	activeId: string | null;
	isHydrated: boolean;
	hydrate: () => Promise<void>;
	setActiveId: (id: string | null) => void;
	add: (name: string) => Promise<void>;
	rename: (id: string, name: string) => Promise<void>;
	remove: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
	categories: [],
	activeId: null,
	isHydrated: false,

	hydrate: async () => {
		const state = await invoke('store:get');
		set({
			categories: (state as { categories?: Category[] }).categories ?? [],
			isHydrated: true,
		});
	},

	setActiveId: (id) => set({ activeId: id }),

	add: async (name) => {
		const category: Category = { id: uuid(), name, createdAt: Date.now() };
		const categories = [...get().categories, category];
		set({ categories });
		await invoke('store:set', { categories } as never);
	},

	rename: async (id, name) => {
		const categories = get().categories.map((c) => (c.id === id ? { ...c, name } : c));
		set({ categories });
		await invoke('store:set', { categories } as never);
	},

	remove: async (id) => {
		const categories = get().categories.filter((c) => c.id !== id);
		set({ categories });
		if (get().activeId === id) set({ activeId: null });
		await invoke('store:set', { categories } as never);
	},
}));
