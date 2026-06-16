import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { saveSupabaseRecord } from '../../Supabase/actions/saveSupabaseRecord';
import { updatePractitioner } from './updatePractitioner';
import { setFeedback } from '../../../../DesignSystem'

const PRACTITIONERS_TABLE = 'practitioners';
const ACCESS_LEVEL = 2;
const DEFAULT_AVATAR_URL = 'https://app.askleida.com/askleida/png/default-logo.png';

type T_CreatePractitionerArgs = {
	email: string;
};

type T_CreatePractitionerResult = {
	email: string;
	practitionerId: string | null;
	practitioner?: Record<string, any>;
	user?: Record<string, any>;
};

export const createPractitioner = ({ email }: T_CreatePractitionerArgs): any =>
	async (dispatch: Dispatch) => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			const msg = 'A practitioner must have an email';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			const response = await dispatch(saveSupabaseRecord({
				resource: 'practitioner-onboard',
				email: normalizedEmail,
				user_metadata: {
					invited_from: 'leida-supabase-module',
					access_level: ACCESS_LEVEL,
					avatar: DEFAULT_AVATAR_URL,
				},
			}));

			const practitioner = response?.practitioner;
			const user = response?.user;
			const practitionerId = practitioner?.practitioner_id || null;

			if (practitionerId) {
				await dispatch(updatePractitioner({
					practitioner_id: practitionerId,
					key: 'avatar',
					value: DEFAULT_AVATAR_URL,
				}));
			}

			await dispatch(fetchSupabaseRows({ table: PRACTITIONERS_TABLE }));
			// dispatch(setUbereduxKey({ key: 'success', value: `Invited ${normalizedEmail}` }));

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
