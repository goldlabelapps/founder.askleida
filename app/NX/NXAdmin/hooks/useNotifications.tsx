'use client';
import { useEffect } from 'react';

/**
 * useNotifications
 *
 * Push notifications are disabled until a provider is configured.
 */
export function useNotifications() {
    useEffect(() => {
        return () => undefined;
    }, []);
}
