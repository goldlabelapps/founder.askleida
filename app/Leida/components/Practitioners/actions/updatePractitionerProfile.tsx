import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../../Leida';
import type { T_UpdatePractitionerProfileInput } from '../../../types.d';

export const updatePractitionerProfile = ({
	practitioner_id,
	email,
	display_name,
	clinic,
	website,
	access_level,
}: T_UpdatePractitionerProfileInput): any =>
	async (dispatch: Dispatch, getState: () => any) => {
		if (!practitioner_id) {
			const msg = 'updatePractitionerProfile requires a practitioner_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		if (!Number.isFinite(access_level)) {
			const msg = 'updatePractitionerProfile requires a valid access_level';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		const normalizedDisplayName = typeof display_name === 'string' ? display_name.trim() : '';
		const normalizedEmail = typeof email === 'string' ? email.trim() : '';
		const normalizedClinic = typeof clinic === 'string' ? clinic.trim() : '';
		const normalizedWebsite = typeof website === 'string' ? website.trim() : '';

		try {
			const res = await fetch('/api/practitioners', {
				method: 'PATCH',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					practitioner_id,
					title: normalizedEmail || normalizedDisplayName || null,
					data: {
						email: normalizedEmail || null,
						display_name: normalizedDisplayName || null,
						name: normalizedDisplayName || null,
						clinic: normalizedClinic || null,
						website: normalizedWebsite || null,
						access_level,
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
							title: normalizedEmail || normalizedDisplayName || null,
							data: {
								...existingData,
								email: normalizedEmail || null,
								display_name: normalizedDisplayName || null,
								name: normalizedDisplayName || null,
								clinic: normalizedClinic || null,
								website: normalizedWebsite || null,
								access_level,
							},
						};
					}),
				};
			});

			await dispatch(setLeida('bus', latestBus));

			return json?.data;
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};