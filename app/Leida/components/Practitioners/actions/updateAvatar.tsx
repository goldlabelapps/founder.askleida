import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../../Leida';
import type { T_UpdateAvatarInput } from '../../../types.d';

export const updateAvatar = ({ practitioner_id, file }: T_UpdateAvatarInput): any =>
	async (dispatch: Dispatch, getState: () => any) => {
		if (!practitioner_id) {
			const msg = 'updateAvatar requires a practitioner_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		if (!file) {
			const msg = 'updateAvatar requires a file';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('practitioner_id', practitioner_id);

			const res = await fetch('/api/practitioners/avatar', {
				method: 'POST',
				body: formData,
			});

			let json: any = null;
			try {
				json = await res.json();
			} catch {
				json = null;
			}

			if (!res.ok) {
				const msg = json?.message || `Failed to update avatar (${res.status})`;
				throw new Error(msg);
			}

			const avatarUrl = json?.data?.avatar_url;
			if (!avatarUrl || typeof avatarUrl !== 'string') {
				throw new Error('Avatar upload succeeded but no avatar URL was returned.');
			}

			const state = getState();
			const leida = state?.redux?.leida || {};
			const bus = leida?.bus || {};
			const latestBus = { ...bus };

			// Update any cached practitioners rows containing this practitioner id.
			Object.keys(latestBus).forEach((key) => {
				const entry = latestBus[key];
				if (!key.includes('practitioners') || !Array.isArray(entry?.data)) return;

				latestBus[key] = {
					...entry,
					data: entry.data.map((row: any) => {
						if (row?.practitioner_id !== practitioner_id) return row;

						const existingData = row?.data && typeof row.data === 'object' ? row.data : {};
						return {
							...row,
							data: {
								...existingData,
								avatar: avatarUrl,
							},
						};
					}),
				};
			});

			await dispatch(setLeida('bus', latestBus));
			dispatch(setUbereduxKey({ key: 'success', value: 'Avatar updated successfully' }));

			return avatarUrl;
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
