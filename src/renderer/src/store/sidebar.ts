import { create } from 'zustand';
import { invoke } from './ipc';
import type { SidebarPosition } from '@shared/ipc-types';

interface SidebarStore {
	position: SidebarPosition;
	isOpen: boolean;
	width: number;
	height: number;
	isHydrated: boolean;
	hydrate: () => Promise<void>;
	toggle: () => Promise<void>;
	setOpen: (isOpen: boolean) => void;
	setPosition: (position: SidebarPosition) => Promise<void>;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
	position: 'right',
	isOpen: true,
	width: 320,
	height: 280,
	isHydrated: false,

	hydrate: async () => {
		const state = await invoke('store:get');
		set({
			position: state.sidebar.position,
			isOpen: state.sidebar.isOpen,
			width: state.sidebar.width,
			height: state.sidebar.height,
			isHydrated: true,
		});
	},

	toggle: async () => {
		const { position, isOpen } = get();
		const next = !isOpen;
		set({ isOpen: next });
		await invoke('sidebar:toggle', { position, isOpen: next });
	},

	setOpen: (isOpen) => set({ isOpen }),

	setPosition: async (position) => {
		const { isOpen } = get();
		set({ position });
		await invoke('sidebar:setPosition', { position, isOpen });
		await invoke('store:set', { sidebar: { ...get(), position } });
	},
}));
