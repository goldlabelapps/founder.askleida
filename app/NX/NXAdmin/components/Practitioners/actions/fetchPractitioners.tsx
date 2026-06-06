import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setNXAdmin } from '../../../../NXAdmin';
import { setPractitioners } from './setPractitioners';

export const fetchPractitioners = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        try {
            const nxAdmin = getState()?.redux?.nxAdmin || {};
            if (!nxAdmin.practitioners) {
                await dispatch(setNXAdmin('practitioners', {
                    slice: 'practitioners',
                }));
            }

            await dispatch(setPractitioners('loading', true));

            const res = await fetch('/api/practitioners', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch {
                json = null;
            }

            if (!res.ok) {
                const message = json?.message || `Failed to fetch practitioners (${res.status})`;
                throw new Error(message);
            }

            const list = Array.isArray(json?.data) ? json.data : [];
            await dispatch(setPractitioners('list', list));
            await dispatch(setPractitioners('loading', false));

        } catch (e: unknown) {
            dispatch(setPractitioners('loading', false));
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };