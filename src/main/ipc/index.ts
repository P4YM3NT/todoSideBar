import { ipcMain, BrowserWindow, nativeTheme } from 'electron';
import type { AppState, SidebarPosition } from '../../shared/ipc-types';
import store from '../store';
import { snapToPosition, resizeSidebar } from '../window';
import log from '../logger';

export function registerIpcHandlers(win: BrowserWindow): void {
	ipcMain.handle('store:get', () => {
		try {
			return { success: true, data: store.store };
		} catch (error) {
			log.error('store:get failed', error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle('store:set', (_event, payload: Partial<AppState>) => {
		try {
			Object.entries(payload).forEach(([key, value]) => {
				store.set(key as keyof AppState, value);
			});
			return { success: true };
		} catch (error) {
			log.error('store:set failed', error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle(
		'sidebar:setPosition',
		(_event, payload: { position: SidebarPosition; isOpen: boolean }) => {
			try {
				snapToPosition(win, payload.position, payload.isOpen);
				store.set('sidebar.position', payload.position);
				return { success: true };
			} catch (error) {
				log.error('sidebar:setPosition failed', error);
				return { success: false, error: String(error) };
			}
		},
	);

	ipcMain.handle(
		'sidebar:resize',
		(_event, payload: { position: SidebarPosition; size: number }) => {
			try {
				resizeSidebar(win, payload.position, payload.size);
				return { success: true };
			} catch (error) {
				log.error('sidebar:resize failed', error);
				return { success: false, error: String(error) };
			}
		},
	);

	ipcMain.handle('sidebar:toggle', (_event, payload: { position: SidebarPosition; isOpen: boolean }) => {
		try {
			snapToPosition(win, payload.position, payload.isOpen);
			store.set('sidebar.isOpen', payload.isOpen);
			return { success: true, data: payload.isOpen };
		} catch (error) {
			log.error('sidebar:toggle failed', error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle('app:getTheme', () => {
		return { success: true, data: nativeTheme.shouldUseDarkColors ? 'dark' : 'light' };
	});

	nativeTheme.on('updated', () => {
		const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
		win.webContents.send('app:onThemeChange', theme);
		log.debug('Theme changed to', theme);
	});
}
