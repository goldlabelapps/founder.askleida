import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setNXAdmin } from '../../../../NXAdmin';
import { fetchPractitioners } from './fetchPractitioners';

export const initPractitioners = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.nxAdmin || {};
            if (!nxAdmin.practitioners) {
                await dispatch(setNXAdmin('practitioners', {
                    slice: 'practitioners',
                    list: [],
                    loading: true,
                }));
            } else {
                await dispatch(setNXAdmin('practitioners', {
                    ...nxAdmin.practitioners,
                    loading: true,
                }));
            }

            await dispatch(fetchPractitioners());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setNXAdmin('practitioners', {
                ...(getState()?.redux?.nxAdmin?.practitioners || {}),
                loading: false,
            }));
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };