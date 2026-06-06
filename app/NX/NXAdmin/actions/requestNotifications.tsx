import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../Uberedux';

/**
 * requestNotifications
 *
 * 1. Requests browser notification permission.
 * Currently no push provider is configured. This action only tracks
 * notification permission state in Redux.
 */
export const requestNotifications = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        if (typeof window === 'undefined') return;

        const setNotif = (patch: Record<string, any>) => {
            const current = getState()?.redux?.nxAdmin?.notifications || {};
            dispatch(setUbereduxKey({
                key: 'nxAdmin.notifications',
                value: { ...current, ...patch },
            }));
        };

        try {
            // ── 1. Permission ─────────────────────────────────────────────
            let permission = Notification.permission as string;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            setNotif({ permission, initialized: true });

            if (permission !== 'granted') return;

            setNotif({
                provider: 'none',
                pushSupported: false,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };
