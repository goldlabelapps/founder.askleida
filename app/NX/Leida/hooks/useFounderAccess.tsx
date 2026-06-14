"use client";
import * as React from 'react';
import { useDispatch } from '../../Uberedux';
import { usePaywall } from '../../Paywall';
import { fetchLeida } from '../actions/fetchLeida';
import { useLeidaBus } from './useLeida';

const ALLOWED_ACCESS_LEVELS = new Set([3, 4]);

function toAccessLevel(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
            return Number(trimmed);
        }
    }
    return null;
}

export function useFounderAccess() {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const uid = typeof paywall?.uid === 'string' ? paywall.uid : null;
    const { loading, data } = useLeidaBus('practitioners');
    const [requestedUid, setRequestedUid] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!uid) {
            setRequestedUid(null);
            return;
        }
        if (requestedUid === uid) return;

        setRequestedUid(uid);
        dispatch(fetchLeida('practitioners'));
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
    const isCheckingAccess = Boolean(uid) && (loading || requestedUid !== uid);

    return {
        accessLevel,
        isAllowed,
        isCheckingAccess,
    };
}