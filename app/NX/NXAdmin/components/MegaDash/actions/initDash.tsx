import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setLeidaAdmin } from '../../../../NXAdmin';

export const initDash = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.leida || {};
            if (!nxAdmin.dash) await dispatch(setLeidaAdmin('dash', {
                title: 'NX° Admin',
                hero: 'accounts',
                panels: [
                    'account',
                    'accounts',
                    'queue',
                ],
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };