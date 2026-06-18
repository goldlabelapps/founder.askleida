import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../../Leida';

export const deletePractitioner = (practitioner_id: string): any =>
	async (dispatch: Dispatch, getState: () => any) => {
		if (!practitioner_id) {
			const msg = 'deletePractitioner requires a practitioner_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			const res = await fetch('/api/practitioners', {
				method: 'DELETE',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ practitioner_id }),
			});

			let json: any = null;
			try {
				json = await res.json();
			} catch {
				json = null;
			}

			if (!res.ok) {
				const msg = json?.message || `Failed to delete practitioner (${res.status})`;
				throw new Error(msg);
			}

			const state = getState();
			const leida = state?.redux?.leida || {};
			const bus = leida?.bus || {};
			const latestBus = { ...bus };

			// Clear cached practitioners entries so follow-up views refetch fresh data.
			Object.keys(latestBus).forEach((key) => {
				if (key.includes('practitioners')) {
					delete latestBus[key];
				}
			});

			await dispatch(setLeida('bus', latestBus));
			dispatch(setUbereduxKey({ key: 'success', value: 'Practitioner deleted successfully' }));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
