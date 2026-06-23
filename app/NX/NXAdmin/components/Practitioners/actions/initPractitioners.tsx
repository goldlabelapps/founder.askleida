import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeidaAdmin } from '../../../../NXAdmin';
import { fetchPractitioners } from './fetchPractitioners';

export const initPractitioners = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.leida || {};
            if (!nxAdmin.practitioners) {
                await dispatch(setLeidaAdmin('practitioners', {
                    slice: 'practitioners',
                    list: [],
                    loading: true,
                }));
            } else {
                await dispatch(setLeidaAdmin('practitioners', {
                    ...nxAdmin.practitioners,
                    loading: true,
                }));
            }

            await dispatch(fetchPractitioners());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setLeidaAdmin('practitioners', {
                ...(getState()?.redux?.leida?.practitioners || {}),
                loading: false,
            }));
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };