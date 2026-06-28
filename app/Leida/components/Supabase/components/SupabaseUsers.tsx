'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Icon } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { navigateTo } from '../../../../NX/DesignSystem';
import { setLeida, useDash } from '../../../../Leida';
import { initSupabase } from '../actions/initSupabase';
import { fetchSupabaseAuthUsers } from '../actions/fetchSupabaseAuthUsers';
import { saveSupabaseRecord } from '../actions/saveSupabaseRecord';
import { useSupabase } from '../hooks/useSupabase';
import type { T_SupabaseAuthUser } from '../../../types.d';
import type { T_SupabaseUsersPractitionerRecord } from '../../../types.d';

export default function SupabaseUsers() {
    const dispatch = useDispatch();
    const dash = useDash();
    const supabase = useSupabase();
    const router = useRouter();

    const currentPage = typeof supabase?.authPage === 'number' && supabase.authPage > 0 ? supabase.authPage : 1;
    const perPage = typeof supabase?.authPerPage === 'number' && supabase.authPerPage > 0 ? supabase.authPerPage : 10;
    const total = typeof supabase?.authTotal === 'number' && supabase.authTotal > 0 ? supabase.authTotal : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const authUsers = (Array.isArray(supabase?.authUsers) ? supabase.authUsers : []) as T_SupabaseAuthUser[];

    const [practitioners, setPractitioners] = React.useState<T_SupabaseUsersPractitionerRecord[]>([]);
    const [practitionersLoading, setPractitionersLoading] = React.useState(false);
    const [practitionersError, setPractitionersError] = React.useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = React.useState('');
    const [createLoading, setCreateLoading] = React.useState(false);
    const [createError, setCreateError] = React.useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

    const authUuidSet = React.useMemo(() => {
        const uuids = authUsers
            .map((user) => (typeof user?.id === 'string' ? user.id : null))
            .filter((value): value is string => Boolean(value));
        return new Set(uuids);
    }, [authUsers]);

    const matchedPractitioners = React.useMemo(() => {
        return practitioners.filter((record) => {
            const practitionerId = typeof record?.practitioner_id === 'string' ? record.practitioner_id : '';
            return practitionerId ? authUuidSet.has(practitionerId) : false;
        }).length;
    }, [authUuidSet, practitioners]);

    const unmatchedPractitioners = practitioners.length - matchedPractitioners;

    const loadPractitioners = React.useCallback(async () => {
        setPractitionersLoading(true);
        setPractitionersError(null);
        try {
            const res = await fetch('/api/practitioners', {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const message = typeof json?.message === 'string'
                    ? json.message
                    : `Failed to fetch practitioners (${res.status})`;
                throw new Error(message);
            }
            const data = Array.isArray(json?.data) ? json.data : [];
            setPractitioners(data as T_SupabaseUsersPractitionerRecord[]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setPractitionersError(msg || 'Failed to fetch practitioners');
        } finally {
            setPractitionersLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!supabase?.initted) {
            dispatch(initSupabase());
        }
    }, [dispatch, supabase?.initted]);

    React.useEffect(() => {
        loadPractitioners();
    }, [loadPractitioners]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Supabase Users',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleRefresh = React.useCallback(() => {
        dispatch(fetchSupabaseAuthUsers({ page: currentPage, perPage }));
        loadPractitioners();
    }, [currentPage, dispatch, loadPractitioners, perPage]);

    const handlePageChange = React.useCallback((page: number) => {
        dispatch(fetchSupabaseAuthUsers({ page, perPage }));
    }, [dispatch, perPage]);

    const handleCreatePractitioner = React.useCallback(async () => {
        setCreateError(null);
        setCreateSuccess(null);

        const email = inviteEmail.trim().toLowerCase();
        if (!email) {
            setCreateError('Email is required');
            return;
        }

        setCreateLoading(true);
        try {
            await dispatch(saveSupabaseRecord({
                resource: 'practitioner-onboard',
                email,
                user_metadata: { invited_from: 'leida-supabase-module' },
            }));
            await loadPractitioners();
            setCreateSuccess(`Invited ${email} and created practitioner record.`);
            setInviteEmail('');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setCreateError(msg || 'Failed to create practitioner');
        } finally {
            setCreateLoading(false);
        }
    }, [dispatch, inviteEmail, loadPractitioners]);

    return (
        <Box sx={{ p: 2 }}>

            <Stack spacing={2}>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Practitioner table</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Key rule: practitioner_id must equal Supabase Auth uid.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                            <Chip size="small" label={`${practitioners.length} practitioners`} />
                            <Chip size="small" variant="outlined" color="success" label={`${matchedPractitioners} matched`} />
                            <Chip size="small" variant="outlined" color={unmatchedPractitioners > 0 ? 'warning' : 'default'} label={`${unmatchedPractitioners} unmatched`} />
                        </Stack>

                        {practitionersError && <Alert severity="error">{practitionersError}</Alert>}

                        <Box sx={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>practitioner_id</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {practitioners.map((record, index) => {
                                        const practitionerId = typeof record?.practitioner_id === 'string' ? record.practitioner_id : '';
                                        const isLinked = practitionerId ? authUuidSet.has(practitionerId) : false;
                                        const name = typeof record?.name === 'string'
                                            ? record.name
                                            : (typeof record?.title === 'string' ? record.title : 'N/A');
                                        return (
                                            <TableRow
                                                key={practitionerId || `practitioner-${index}`}
                                                hover
                                                onClick={() => {
                                                    if (practitionerId) dispatch(navigateTo(router, `/practitioners/${practitionerId}`));
                                                }}
                                                sx={{ cursor: practitionerId ? 'pointer' : 'default' }}
                                            >
                                                <TableCell>{name}</TableCell>
                                                <TableCell>{practitionerId || 'N/A'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>

                        {practitionersLoading && (
                            <Typography variant="caption" color="text.secondary">
                                Loading practitioners...
                            </Typography>
                        )}
                    </Stack>
                </Paper>

                
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Authenticated users list from Supabase Auth.</Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                            <Chip size="small" label={`${total} users`} />
                            <Chip size="small" variant="outlined" label={`Page ${currentPage} of ${totalPages}`} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={Boolean(supabase?.authLoading) || !canGoPrevious}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={Boolean(supabase?.authLoading) || !canGoNext}
                            >
                                Next
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRefresh}
                                disabled={Boolean(supabase?.authLoading)}
                            >
                                Refresh
                            </Button>
                        </Stack>

                        {supabase?.authError && <Alert severity="error">{supabase.authError}</Alert>}

                        <Box sx={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Email</TableCell>
                                        <TableCell>UUID</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {authUsers.map((user) => (
                                        <TableRow key={user.id || user.email} hover>
                                            <TableCell>{user.email || user.id || 'Unknown'}</TableCell>
                                            <TableCell>{user.id || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Stack>
                </Paper>

                
            </Stack>
        </Box>
    );
}
