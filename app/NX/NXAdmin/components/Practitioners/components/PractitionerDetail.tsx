'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { setLeidaAdmin } from '../../../../NXAdmin';
import { usePractitioners } from '../hooks/usePractitioners';
import { setPractitioners } from '../actions/setPractitioners';
import Editable from '../../UI/Editable';

type T_Practitioner = {
    practitioner_id?: string;
    title?: string | null;
    data?: {
        avatar?: string;
        display_name?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

interface I_PractitionerDetail {
    practitionerId: string;
}

export default function PractitionerDetail({ practitionerId }: I_PractitionerDetail) {
    const dispatch = useDispatch();
    const router = useRouter();
    const practitioners = usePractitioners();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [record, setRecord] = React.useState<T_Practitioner | null>(null);
    const [title, setTitle] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [avatar, setAvatar] = React.useState('');

    const syncForm = React.useCallback((nextRecord: T_Practitioner | null) => {
        setTitle(typeof nextRecord?.title === 'string' ? nextRecord.title : '');
        setDisplayName(typeof nextRecord?.data?.display_name === 'string' ? nextRecord.data.display_name : '');
        setAvatar(typeof nextRecord?.data?.avatar === 'string' ? nextRecord.data.avatar : '');
    }, []);

    React.useEffect(() => {
        dispatch(setLeidaAdmin('header', {
            title: 'Practitioner',
            icon: 'visitor'
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
                const fetchedRecord = (json?.data || null) as T_Practitioner | null;
                setRecord(fetchedRecord);
                syncForm(fetchedRecord);
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
    }, [practitionerId, syncForm]);

    const handleBack = React.useCallback(() => {
        dispatch(navigateTo(router, '/practitioners'));
    }, [dispatch, router]);

    const handleSave = React.useCallback(async () => {
        if (!record?.practitioner_id) {
            setSaveError('Cannot save: missing practitioner id.');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        try {
            const res = await fetch('/api/practitioners', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    practitioner_id: record.practitioner_id,
                    title,
                    data: {
                        display_name: displayName,
                        avatar,
                    },
                }),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const message = json?.message || `Failed to update practitioner (${res.status})`;
                throw new Error(message);
            }

            const updatedRecord =
                (Array.isArray(json?.data) ? json?.data?.[0] : json?.data) ||
                {
                    ...record,
                    title,
                    data: {
                        ...(record?.data || {}),
                        display_name: displayName,
                        avatar,
                    },
                };

            setRecord(updatedRecord as T_Practitioner);
            syncForm(updatedRecord as T_Practitioner);

            const currentList = Array.isArray(practitioners?.list) ? practitioners.list as T_Practitioner[] : [];
            const updatedId = (updatedRecord as T_Practitioner)?.practitioner_id;

            if (updatedId) {
                const nextList = currentList.some((item) => item?.practitioner_id === updatedId)
                    ? currentList.map((item) => (item?.practitioner_id === updatedId ? { ...item, ...(updatedRecord as T_Practitioner) } : item))
                    : [{ ...(updatedRecord as T_Practitioner) }, ...currentList];

                await dispatch(setPractitioners('list', nextList));
            }

            setSaveSuccess('Practitioner updated.');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    }, [avatar, dispatch, displayName, practitioners?.list, record, syncForm, title]);

    const hasChanges = React.useMemo(() => {
        if (!record) return false;
        const currentTitle = typeof record.title === 'string' ? record.title : '';
        const currentDisplayName = typeof record.data?.display_name === 'string' ? record.data.display_name : '';
        const currentAvatar = typeof record.data?.avatar === 'string' ? record.data.avatar : '';

        return title !== currentTitle || displayName !== currentDisplayName || avatar !== currentAvatar;
    }, [avatar, displayName, record, title]);

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
                        <Stack spacing={2}>
                            {saveError ? <Alert severity="error">{saveError}</Alert> : null}
                            {saveSuccess ? <Alert severity="success">{saveSuccess}</Alert> : null}

                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={avatar || undefined}
                                    alt={displayName || title || 'Practitioner avatar'}
                                    sx={{ width: 64, height: 64 }}
                                />
                                <Stack>
                                    <Typography variant="subtitle1">{displayName || 'Unnamed practitioner'}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {record.practitioner_id}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Divider />

                            <Editable
                                label="Title"
                                placeholder="Founder"
                                value={title}
                                onChange={setTitle}
                            />

                            <Editable
                                label="Display Name"
                                placeholder="Millie"
                                value={displayName}
                                onChange={setDisplayName}
                            />

                            <Editable
                                label="Avatar URL"
                                placeholder="https://.../avatar.png"
                                value={avatar}
                                onChange={setAvatar}
                            />

                            <Box>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                >
                                    {saving ? 'Saving...' : 'Save Practitioner'}
                                </Button>
                            </Box>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}