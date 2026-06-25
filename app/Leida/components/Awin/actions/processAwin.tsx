import type { Dispatch } from 'redux';
import type { T_AwinProduct } from '../../../../types';
import { setUbereduxKey } from '../../../../NX/Uberedux';

export const processAwin =
	(awin: T_AwinProduct): any =>
		async (dispatch: Dispatch) => {
			try {
				console.log('[processAwin] Starting process for AWIN product:', awin);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				dispatch(setUbereduxKey({ key: 'error', value: msg }));
			}
		};