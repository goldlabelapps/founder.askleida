import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { fetchLeida } from '../../../actions/fetchLeida';
import { updatePractitioner } from './updatePractitioner';
import { setFeedback } from '../../../../NX/DesignSystem'
import type { T_CreatePractitionerArgs, T_CreatePractitionerResult } from '../../../types.d';

const PRACTITIONERS_ROUTE = '/api/practitioners';
const ACCESS_LEVEL = 3;
const DEFAULT_AVATAR_URL = 'https://app.askleida.com/askleida/png/default-logo.png';

export const createPractitioner = ({ email, name }: T_CreatePractitionerArgs): any =>
	async (dispatch: Dispatch) => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			const msg = 'A practitioner must have an email';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		const normalizedName = typeof name === 'string' ? name.trim() : '';
		if (!normalizedName) {
			const msg = 'A practitioner must have a name';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		const redirectTo = typeof window !== 'undefined'
			? `${window.location.origin}/practitioners`
			: '/practitioners';

		try {
			const response = await fetch(PRACTITIONERS_ROUTE, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					resource: 'practitioner-onboard',
					name: normalizedName,
					email: normalizedEmail,
					redirectTo,
					user_metadata: {
						name: normalizedName,
						display_name: normalizedName,
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
			const resolvedPractitionerId = practitioner?.practitioner_id || user?.id || null;

			if (resolvedPractitionerId) {
				await dispatch(updatePractitioner({
					practitioner_id: resolvedPractitionerId,
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
				practitionerId: resolvedPractitionerId,
				practitioner,
				user,
			} as T_CreatePractitionerResult;
			
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				title: msg || 'Failed to create practitioner',
				severity: 'error',
			}));
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
