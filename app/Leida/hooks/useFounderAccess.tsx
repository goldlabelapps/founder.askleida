"use client";
import * as React from 'react';
import { useDispatch } from '../../NX/Uberedux';
import { usePaywall } from '../../NX/Paywall';
import { fetchLeida } from '../actions/fetchLeida';
import { toAccessLevel } from '../lib/toAccessLevel';
import { useLeida, useLeidaBus } from './useLeida';

const ALLOWED_ACCESS_LEVELS = new Set([3, 4]);

export function useFounderAccess() {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const leida = useLeida();
    const uid = typeof paywall?.uid === 'string' ? paywall.uid : null;
    const { loading, data } = useLeidaBus('practitioners');
    const [requestedUid, setRequestedUid] = React.useState<string | null>(null);
    const practitionersRouteEntry = leida?.bus?.['/api/practitioners'];

    React.useEffect(() => {
        if (!uid) {
            setRequestedUid(null);
            return;
        }
        if (practitionersRouteEntry) {
            setRequestedUid(uid);
            return;
        }
        if (requestedUid === uid) return;

        setRequestedUid(uid);
        dispatch(fetchLeida('practitioners'));
    }, [dispatch, practitionersRouteEntry, requestedUid, uid]);

    const practitionerRecord = React.useMemo(() => {
        if (!uid || !Array.isArray(data)) return null;
        return data.find((item: any) => item?.practitioner_id === uid) || null;
    }, [data, uid]);

    const accessLevel = React.useMemo(() => {
        const rawAccessLevel = practitionerRecord?.data
            && typeof practitionerRecord.data === 'object'
            ? (practitionerRecord.data as Record<string, unknown>).access_level
            : null;
        return toAccessLevel(rawAccessLevel);
    }, [practitionerRecord]);

    const isAllowed = accessLevel !== null && ALLOWED_ACCESS_LEVELS.has(accessLevel);
    const isCheckingAccess = Boolean(uid) && (loading || requestedUid !== uid);

    return {
        accessLevel,
        isAllowed,
        isCheckingAccess,
    };
}