import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	main: {
		resolve: { alias: { '@shared': resolve('src/shared') } },
		build: {
			rollupOptions: { external: ['electron'] },
		},
	},
	preload: {
		resolve: { alias: { '@shared': resolve('src/shared') } },
		build: {
			rollupOptions: { external: ['electron'] },
		},
	},
	renderer: {
		plugins: [react()],
		resolve: {
			alias: {
				'@renderer': resolve('src/renderer/src'),
				'@shared': resolve('src/shared'),
			},
		},
	},
});
