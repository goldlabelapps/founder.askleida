import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { fetchLeida } from '../../../actions/fetchLeida';
import { updatePractitioner } from './updatePractitioner';
import { setFeedback } from '../../../../NX/DesignSystem'
import type { T_CreatePractitionerArgs, T_CreatePractitionerResult } from '../../../types.d';

const PRACTITIONERS_ROUTE = '/api/practitioners';
const SUPABASE_ROUTE = '/api/supabase';
const ACCESS_LEVEL = 3;
const DEFAULT_AVATAR_URL = 'https://app.askleida.com/askleida/png/default-logo.png';

const slugify = (value: string) => value
	.normalize('NFKD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-+|-+$/g, '');

const hashString = (value: string) => {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash << 5) - hash + value.charCodeAt(index);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
};

const buildPractitionerSlug = (name: string, email: string) => {
	const baseSlug = slugify(name) || 'practitioner';
	const uniqueSuffix = hashString(email).slice(0, 6) || '000000';
	return `${baseSlug}-${uniqueSuffix}`;
};

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
		const slug = buildPractitionerSlug(normalizedName, normalizedEmail);

		try {
			const response = await fetch(SUPABASE_ROUTE, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					resource: 'practitioner-onboard',
					email: normalizedEmail,
					redirectTo,
					user_metadata: {
						name: normalizedName,
						display_name: normalizedName,
						slug,
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
