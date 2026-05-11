/// <reference types="vite/client" />

interface Window {
	api: {
		invoke: (channel: string, payload?: unknown) => Promise<unknown>;
		on: (channel: string, callback: (data: unknown) => void) => () => void;
	};
}
