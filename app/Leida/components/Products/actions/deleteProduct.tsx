import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { deleteSupabaseRecord } from '../../Supabase/actions/deleteSupabaseRecord';

export const deleteProduct = (product_id: string): any =>
	async (dispatch: Dispatch) => {
		if (!product_id) {
			const msg = 'deleteProduct requires a product_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			await dispatch(deleteSupabaseRecord({
				table: 'products',
				match: { product_id },
			}));
			dispatch(setUbereduxKey({ key: 'success', value: 'Product deleted successfully' }));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
