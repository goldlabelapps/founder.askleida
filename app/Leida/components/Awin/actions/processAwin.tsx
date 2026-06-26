import type { Dispatch } from 'redux';
import type { T_AwinProcessDecision, T_AwinProduct } from '../../../types';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { fetchLeida } from '../../../actions/fetchLeida';

export const processAwin =
	({
		awin,
		decision,
		practitionerId,
	}: {
		awin: T_AwinProduct;
		decision: T_AwinProcessDecision;
		practitionerId: string;
	}): any =>
		async (dispatch: Dispatch) => {
			try {
				const res = await fetch('/api/awin/lookfantastic/queue', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify({
						practitioner_id: practitionerId,
						decision,
						awinProduct: awin,
					}),
				});

				const json = await res.json().catch(() => null);

				if (!res.ok) {
					const message = json?.message || `Failed to process AWIN product (${res.status})`;
					throw new Error(message);
				}

				if (decision === 'queue') {
					await dispatch(fetchLeida('/api/products/queue'));
				}

				return {
					ok: true,
					data: json?.data || null,
				};
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				dispatch(setUbereduxKey({ key: 'error', value: msg }));
				return {
					ok: false,
					error: msg,
				};
			}
		};