import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';
import { setLeida, fetchLeida } from '../../../../Leida';

const AWIN_ROUTE = '/api/awin?limit=25&orderBy=created_at&orderDir=desc';

export const initAwin = (): any =>
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

            await dispatch(fetchLeida(AWIN_ROUTE));

            const latestLeida = getState()?.redux?.leida || {};
            const bus = latestLeida?.bus || {};
            const routeEntry = bus?.[AWIN_ROUTE] || {};
            const routeData = Array.isArray(routeEntry?.data) ? routeEntry.data : [];
            const first = routeData[0] || {};

            const rows = Array.isArray(first?.rows)
                ? first.rows
                : routeData;
            const products = rows;
            const count = typeof first?.count === 'number'
                ? first.count
                : products.length;
            const scanned = products.length;

            const currentAwin = latestLeida?.awin || {};
            await dispatch(setLeida('awin', {
                ...currentAwin,
                initted: true,
                rows,
                products,
                count,
                scanned,
                sourceRoute: AWIN_ROUTE,
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            dispatch(setUbereduxKey({ key: 'error', value: msg }));
        }
    };