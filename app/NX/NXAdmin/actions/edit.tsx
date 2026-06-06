import type { Dispatch } from 'redux';
// import { setUbereduxKey } from '../../Uberedux';
import { setCRUD} from '../../NXAdmin';
import { supabase } from '../../lib/supabase';

export const edit = (
    collection: string,
    data: any,
): any =>
    async (dispatch: Dispatch) => {
        try {
            const { id, ...payload } = data || {};
            if (!id) throw new Error('Cannot edit document without id');

            const { data: rows, error } = await supabase
                .from(collection)
                .update(payload)
                .eq('id', id)
                .select()
                .limit(1);

            if (error) throw error;

            const newDoc = rows?.[0] || data;
            dispatch(setCRUD(collection, 'selected', newDoc));
            dispatch(setCRUD(collection, 'mode', 'read'));
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setCRUD(collection, 'saving', false));
            dispatch(setCRUD(collection, 'error', msg));
        } finally {
            dispatch(setCRUD(collection, 'saving', false));
        }
    };
