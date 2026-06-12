import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { saveSupabaseRecord } from '../../Supabase/actions/saveSupabaseRecord';

type T_UpdateProductInput = {
	product_id: string;
	title: string;
	description: string;
	category: string;
	price: string;
};

export const updateProduct = ({ product_id, title, description, category, price }: T_UpdateProductInput): any =>
	async (dispatch: Dispatch) => {
		if (!product_id) {
			const msg = 'updateProduct requires a product_id';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		if (!title.trim()) {
			const msg = 'Product title is required';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		const parsedPrice = Number(price);
		if (!Number.isFinite(parsedPrice)) {
			const msg = 'Price must be a valid number';
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw new Error(msg);
		}

		try {
			await dispatch(saveSupabaseRecord({
				table: 'products',
				match: { product_id },
				values: {
					title: title.trim(),
					data: {
						name: title.trim(),
						description: description.trim(),
						category: category.trim(),
						price: parsedPrice,
					},
				},
			}));

			dispatch(setUbereduxKey({ key: 'success', value: 'Product updated successfully' }));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setUbereduxKey({ key: 'error', value: msg }));
			throw e;
		}
	};
