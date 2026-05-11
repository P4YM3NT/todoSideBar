import { app, globalShortcut, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import { join } from 'path';
import './logger';
import log from './logger';
import { createWindow } from './window';
import { registerIpcHandlers } from './ipc';
import store from './store';

let tray: Tray | null = null;

app.whenReady().then(() => {
	log.info('App starting', { version: app.getVersion(), platform: process.platform });

	const win = createWindow();

	registerIpcHandlers(win);

	// Open DevTools on F12 in development
	if (!app.isPackaged) {
		app.on('browser-window-created', (_, window: BrowserWindow) => {
			window.webContents.on('before-input-event', (_, input) => {
				if (input.key === 'F12') window.webContents.openDevTools();
			});
		});
	}

	const shortcut = store.get('settings.globalShortcut') as string;
	globalShortcut.register(shortcut, () => {
		const isOpen = !store.get('sidebar.isOpen');
		const position = store.get('sidebar.position');
		win.webContents.send('sidebar:toggleFromMain', isOpen);
		store.set('sidebar.isOpen', isOpen);
		log.debug('Global shortcut triggered, isOpen:', isOpen, 'position:', position);
	});

	const iconPath = join(__dirname, '../../resources/tray-icon.png');
	const icon = nativeImage.createFromPath(iconPath);
	tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Todo Sidebar öffnen / schließen',
			click: () => {
				const isOpen = !store.get('sidebar.isOpen');
				win.webContents.send('sidebar:toggleFromMain', isOpen);
				store.set('sidebar.isOpen', isOpen);
			},
		},
		{ type: 'separator' },
		{ label: 'Beenden', click: () => app.quit() },
	]);

	tray.setContextMenu(contextMenu);
	tray.setToolTip('Todo Sidebar');

	tray.on('click', () => {
		const isOpen = !store.get('sidebar.isOpen');
		win.webContents.send('sidebar:toggleFromMain', isOpen);
		store.set('sidebar.isOpen', isOpen);
	});

	app.on('activate', () => {
		win.show();
	});

	log.info('App ready');
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
	globalShortcut.unregisterAll();
	log.info('App quitting');
});
