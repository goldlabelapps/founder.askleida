import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { fetchLeida } from '../../../actions/fetchLeida';
import { updatePractitioner } from './updatePractitioner';
import { setFeedback } from '../../../../NX/DesignSystem'
import type { T_CreatePractitionerArgs, T_CreatePractitionerResult } from '../../../types.d';

const PRACTITIONERS_ROUTE = '/api/practitioners';
const ACCESS_LEVEL = 3;
const DEFAULT_AVATAR_URL = 'https://app.askleida.com/askleida/png/default-logo.png';

export const createPractitioner = ({ email }: T_CreatePractitionerArgs): any =>
	async (dispatch: Dispatch) => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			const msg = 'A practitioner must have an email';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			const response = await fetch(PRACTITIONERS_ROUTE, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: normalizedEmail,
					data: {
						invited_from: 'leida-practitioner-module',
						access_level: ACCESS_LEVEL,
						avatar: DEFAULT_AVATAR_URL,
					},
				}),
			});

			let json: any = null;
			try {
				json = await response.json();
			} catch {
				json = null;
			}

			if (!response.ok) {
				throw new Error(json?.message || `Failed to create practitioner (${response.status})`);
			}

			const payload = json?.data || json || {};

			const practitioner = payload?.practitioner;
			const user = payload?.user;
			const practitionerId = practitioner?.practitioner_id || null;

			if (practitionerId) {
				await dispatch(updatePractitioner({
					practitioner_id: practitionerId,
					key: 'avatar',
					value: DEFAULT_AVATAR_URL,
				}));
			}

			await dispatch(fetchLeida(PRACTITIONERS_ROUTE));

			dispatch(setFeedback({
				title: `Invited ${normalizedEmail}`,
				severity: 'success',
			}));

			return {
				email: normalizedEmail,
				practitionerId,
				practitioner,
				user,
			} as T_CreatePractitionerResult;
			
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
