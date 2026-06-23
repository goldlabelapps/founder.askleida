import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeidaAdmin } from '../../../../NXAdmin';

export const initAccount = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.leida || {};
            if (!nxAdmin.account) await dispatch(setLeidaAdmin('account', {
                slice: 'account',
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };