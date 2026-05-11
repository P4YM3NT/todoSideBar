import { BrowserWindow, screen, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import type { SidebarPosition } from '../shared/ipc-types';
import log from './logger';

const SIDEBAR_WIDTH = 320;
const SIDEBAR_HEIGHT_TOP = 280;
const COLLAPSED_SIZE = 18;

export function createWindow(): BrowserWindow {
	const win = new BrowserWindow({
		width: SIDEBAR_WIDTH,
		height: 800,
		x: 0,
		y: 0,
		show: false,
		frame: false,
		alwaysOnTop: true,
		transparent: false,
		resizable: false,
		skipTaskbar: false,
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	if (process.platform === 'darwin') {
		win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		win.setFullScreenable(false);
	}

	win.on('ready-to-show', () => {
		win.show();
		snapToPosition(win, 'right', true);
		log.info('Main window ready');
	});

	win.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		win.loadURL(process.env['ELECTRON_RENDERER_URL']);
	} else {
		win.loadFile(join(__dirname, '../renderer/index.html'));
	}

	return win;
}

export function snapToPosition(
	win: BrowserWindow,
	position: SidebarPosition,
	isOpen: boolean,
): void {
	const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
	const { x: workX, y: workY } = screen.getPrimaryDisplay().workArea;

	let x: number;
	let y: number;
	let w: number;
	let h: number;

	switch (position) {
		case 'left':
			w = isOpen ? SIDEBAR_WIDTH : COLLAPSED_SIZE;
			h = screenH;
			x = workX;
			y = workY;
			break;
		case 'right':
			w = isOpen ? SIDEBAR_WIDTH : COLLAPSED_SIZE;
			h = screenH;
			x = workX + screenW - w;
			y = workY;
			break;
		case 'top':
			w = screenW;
			h = isOpen ? SIDEBAR_HEIGHT_TOP : COLLAPSED_SIZE;
			x = workX;
			y = workY;
			break;
	}

	win.setBounds({ x, y, width: w, height: h }, true);
	log.debug(`Snapped to ${position}, open=${isOpen}`);
}

export function resizeSidebar(
	win: BrowserWindow,
	position: SidebarPosition,
	size: number,
): void {
	const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
	const { x: workX, y: workY } = screen.getPrimaryDisplay().workArea;
	const MIN = 220;
	const MAX_LR = 480;
	const MAX_TOP = Math.floor(screenH * 0.6);

	if (position === 'left' || position === 'right') {
		const w = Math.min(MAX_LR, Math.max(MIN, size));
		const x = position === 'right' ? workX + screenW - w : workX;
		win.setBounds({ x, y: workY, width: w, height: screenH });
	} else {
		const h = Math.min(MAX_TOP, Math.max(200, size));
		win.setBounds({ x: workX, y: workY, width: screenW, height: h });
	}
}
