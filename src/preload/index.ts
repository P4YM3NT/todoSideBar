import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
	invoke: (channel: string, payload?: unknown): Promise<unknown> =>
		ipcRenderer.invoke(channel, payload),

	on: (channel: string, callback: (data: unknown) => void): (() => void) => {
		const handler = (_: Electron.IpcRendererEvent, data: unknown): void => callback(data);
		ipcRenderer.on(channel, handler);
		return () => ipcRenderer.removeListener(channel, handler);
	},
};

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (non-isolated context fallback) (fallback for non-isolated context)
	window.electron = electronAPI;
	// @ts-expect-error (non-isolated context fallback)
	window.api = api;
}
