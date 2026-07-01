import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida } from '../../../actions/setLeida';
import { fetchAWIN } from './fetchAwin';

const AWIN_INITIAL_LIMIT = 100;

export const initAWIN = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const leida = getState()?.redux?.leida || {};
            if (!leida.awin) {
                await dispatch(setLeida('awin', {
                    initted: true,
                    products: [],
                    count: 0,
                    rows: [],
                }));
            }

            const currentAWIN = getState()?.redux?.leida?.awin || {};
            const alreadyInitted = Boolean(currentAWIN?.initted);

            if (alreadyInitted) {
                return;
            }

            const result = await dispatch(fetchAWIN({
                page: 1,
                limit: AWIN_INITIAL_LIMIT,
                orderBy: 'created_at',
                orderDir: 'desc',
            }));

            if (!result?.ok) {
                throw new Error(result?.error || 'Failed to initialize AWIN products');
            }

            const latestAWIN = getState()?.redux?.leida?.awin || {};
            await dispatch(setLeida('awin', {
                ...latestAWIN,
                initted: true,
                sourceRoute: result.route,
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };