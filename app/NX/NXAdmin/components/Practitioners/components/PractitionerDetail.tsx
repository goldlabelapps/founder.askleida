'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { setNXAdmin } from '../../../../NXAdmin';

type T_Practitioner = {
    practitioner_id?: string;
    title?: string | null;
    data?: Record<string, unknown>;
    [key: string]: unknown;
};

interface I_PractitionerDetail {
    practitionerId: string;
}

export default function PractitionerDetail({ practitionerId }: I_PractitionerDetail) {
    const dispatch = useDispatch();
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [record, setRecord] = React.useState<T_Practitioner | null>(null);

    React.useEffect(() => {
        dispatch(setNXAdmin('header', {
            title: 'Practitioner Detail',
            icon: 'visitor',
            subheader: practitionerId,
        }));
    }, [dispatch, practitionerId]);

    React.useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/practitioners/${encodeURIComponent(practitionerId)}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                    const message = json?.message || `Failed to fetch practitioner (${res.status})`;
                    throw new Error(message);
                }

                if (!isMounted) return;
                setRecord((json?.data || null) as T_Practitioner | null);
            } catch (e: unknown) {
                if (!isMounted) return;
                const msg = e instanceof Error ? e.message : String(e);
                setError(msg);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (practitionerId) {
            load();
        } else {
            setLoading(false);
            setError('Missing practitioner id.');
        }

        return () => {
            isMounted = false;
        };
    }, [practitionerId]);

    const handleBack = React.useCallback(() => {
        dispatch(navigateTo(router, '/practitioners'));
    }, [dispatch, router]);

    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <Box>
                        <Button onClick={handleBack} variant="outlined" size="small">
                            Back to Practitioners
                        </Button>
                    </Box>

                    {loading && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                                Loading practitioner...
                            </Typography>
                        </Stack>
                    )}

                    {!loading && error && <Alert severity="error">{error}</Alert>}

                    {!loading && !error && record && (
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 2,
                                borderRadius: 1,
                                overflowX: 'auto',
                            }}
                        >
                            {JSON.stringify(record, null, 2)}
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}