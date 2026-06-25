import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setFeedback } from '../../../../NX/DesignSystem';
import { setLeida } from '../../../../Leida';

type T_UpdatePractitionerInput = {
	practitioner_id: string;
	key: string;
	value: unknown;
};

export const updatePractitioner = ({ practitioner_id, key, value }: T_UpdatePractitionerInput): any =>
	async (dispatch: Dispatch, getState: () => any) => {
		if (!practitioner_id) {
			const msg = 'updatePractitioner requires a practitioner_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		if (!key || !key.trim()) {
			const msg = 'updatePractitioner requires a key';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		const normalizedKey = key.trim();

		try {
			const res = await fetch('/api/practitioners', {
				method: 'PATCH',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					practitioner_id,
					data: {
						[normalizedKey]: value,
					},
				}),
			});

			let json: any = null;
			try {
				json = await res.json();
			} catch {
				json = null;
			}

			if (!res.ok) {
				const msg = json?.message || `Failed to update practitioner (${res.status})`;
				throw new Error(msg);
			}

			const state = getState();
			const leida = state?.redux?.leida || {};
			const bus = leida?.bus || {};
			const latestBus = { ...bus };

			Object.keys(latestBus).forEach((routeKey) => {
				const entry = latestBus[routeKey];
				if (!routeKey.includes('practitioners') || !Array.isArray(entry?.data)) return;

				latestBus[routeKey] = {
					...entry,
					data: entry.data.map((row: any) => {
						if (row?.practitioner_id !== practitioner_id) return row;

						const existingData = row?.data && typeof row.data === 'object' ? row.data : {};
						return {
							...row,
							data: {
								...existingData,
								[normalizedKey]: value,
							},
						};
					}),
				};
			});

			await dispatch(setLeida('bus', latestBus));
			dispatch(setFeedback({
				severity: 'success',
				title: 'Practitioner updated successfully',
			}))
			dispatch(setUbereduxKey({ key: 'success', value: 'Practitioner updated successfully' }));

			return json?.data;
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
