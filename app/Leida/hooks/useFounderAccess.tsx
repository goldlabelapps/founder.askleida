"use client";
import * as React from 'react';
import { useDispatch } from '../../NX/Uberedux';
import { usePaywall } from '../../NX/Paywall';
import { fetchLeida } from '../actions/fetchLeida';
import { toAccessLevel } from '../lib/toAccessLevel';
import { useLeidaBus } from './useLeida';

const ALLOWED_ACCESS_LEVELS = new Set([3, 4]);

export function useFounderAccess() {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const uid = typeof paywall?.uid === 'string' ? paywall.uid : null;
    const { data } = useLeidaBus('practitioners');
    const [requestedUid, setRequestedUid] = React.useState<string | null>(null);
    const [isFetchingAccess, setIsFetchingAccess] = React.useState(false);
    const inFlightUidRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        if (!uid) {
            setRequestedUid(null);
            setIsFetchingAccess(false);
            inFlightUidRef.current = null;
            return;
        }
        if (requestedUid === uid || inFlightUidRef.current === uid) return;

        inFlightUidRef.current = uid;
        setIsFetchingAccess(true);

        void (async () => {
            try {
                await dispatch(fetchLeida('practitioners'));
            } finally {
                setRequestedUid(uid);
                setIsFetchingAccess(false);
                if (inFlightUidRef.current === uid) {
                    inFlightUidRef.current = null;
                }
            }
        })();
    }, [dispatch, requestedUid, uid]);

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
    const isCheckingAccess = Boolean(uid) && (requestedUid !== uid || isFetchingAccess);

    return {
        accessLevel,
        isAllowed,
        isCheckingAccess,
    };
}