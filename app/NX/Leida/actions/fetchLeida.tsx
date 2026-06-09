import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';
import { setLeida } from '../../Leida';
import { normalizeLeidaRouteKey } from '../lib/normalizeLeidaRouteKey';

type T_LeidaBusEntry = {
	loading: boolean;
	error: string | null;
	data: any[];
};

function parseArrayData(payload: any): any[] {
	if (Array.isArray(payload?.data?.tables)) return payload.data.tables;
	if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
	if (Array.isArray(payload?.data?.items)) return payload.data.items;
	if (Array.isArray(payload?.tables)) return payload.tables;
	if (Array.isArray(payload?.data)) return payload.data;
	if (Array.isArray(payload)) return payload;
	if (payload?.data && typeof payload.data === 'object') return [payload.data];
	return [];
}

export const fetchLeida = (route: string): any =>
	async (dispatch: Dispatch, getState: () => any) => {
		const routeKey = normalizeLeidaRouteKey(route);
		if (!routeKey) {
			dispatch(setUbereduxKey({ key: 'error', value: 'fetchLeida(route) requires a route value' }));
			return;
		}

		try {
			const state = getState();
			const leida = state?.redux?.leida || {};
			const bus = leida?.bus || {};
			const current = bus?.[routeKey] as T_LeidaBusEntry | undefined;

			if (current?.loading) return;

			await dispatch(setLeida('bus', {
				...bus,
				[routeKey]: {
					loading: true,
					error: null,
					data: Array.isArray(current?.data) ? current.data : [],
				},
			}));

			const res = await fetch(routeKey, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			});

			let json: any = null;
			try {
				json = await res.json();
			} catch {
				json = null;
			}

			if (!res.ok) {
				const msg = json?.message || `Failed to fetch ${routeKey} (${res.status})`;
				throw new Error(msg);
			}

			const parsedData = parseArrayData(json);
			const latestBus = getState()?.redux?.leida?.bus || {};
			await dispatch(setLeida('bus', {
				...latestBus,
				[routeKey]: {
					loading: false,
					error: null,
					data: parsedData,
				},
			}));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			const latestBus = getState()?.redux?.leida?.bus || {};
			const existing = latestBus?.[routeKey] || {};

			await dispatch(setLeida('bus', {
				...latestBus,
				[routeKey]: {
					loading: false,
					error: msg,
					data: Array.isArray(existing?.data) ? existing.data : [],
				},
			}));
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
		}
	};
