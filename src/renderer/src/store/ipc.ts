import type { AppState, SidebarPosition } from '@shared/ipc-types';

type Payloads = {
	'store:get': void;
	'store:set': Partial<AppState>;
	'sidebar:setPosition': { position: SidebarPosition; isOpen: boolean };
	'sidebar:toggle': { position: SidebarPosition; isOpen: boolean };
	'sidebar:resize': { position: SidebarPosition; size: number };
	'app:getTheme': void;
};

type Responses = {
	'store:get': AppState;
	'store:set': void;
	'sidebar:setPosition': void;
	'sidebar:toggle': boolean;
	'sidebar:resize': void;
	'app:getTheme': 'light' | 'dark';
};

export async function invoke<K extends keyof Payloads>(
	channel: K,
	payload?: Payloads[K],
): Promise<Responses[K]> {
	const res = (await window.api.invoke(channel, payload)) as {
		success: boolean;
		data: Responses[K];
		error?: string;
	};
	if (!res.success) throw new Error(res.error ?? `IPC ${channel} failed`);
	return res.data;
}
