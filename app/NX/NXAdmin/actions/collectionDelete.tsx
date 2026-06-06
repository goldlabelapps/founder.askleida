import type { Dispatch } from 'redux';
import { setCRUD} from '../../NXAdmin';
import { supabase } from '../../lib/supabase';

export const collectionDelete = (
    collection: string,
    selected: any,
): any =>
    async (dispatch: Dispatch) => {
        try {
            const { id } = selected;
            const { error } = await supabase
                .from(collection)
                .delete()
                .eq('id', id);

            if (error) throw error;

            dispatch(setCRUD(collection, 'mode', 'read'));
            dispatch(setCRUD(collection, 'selected', null));
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setCRUD(collection, 'saving', false));
            dispatch(setCRUD(collection, 'error', msg));
        } finally {
            dispatch(setCRUD(collection, 'saving', false));
        }
    };
