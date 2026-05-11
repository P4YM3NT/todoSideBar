import { create } from 'zustand';
import type { Category } from '@shared/ipc-types';

interface CategoryStore {
	categories: Category[];
	activeId: string | null;
	setActiveId: (id: string | null) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
	categories: [],
	activeId: null,
	setActiveId: (id) => set({ activeId: id }),
}));
