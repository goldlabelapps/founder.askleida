'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
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
import type { T_SupabaseAuthUser } from '../types';
import { parseJsonRecord } from '../../../lib/parseJsonRecord';
import { stringifyJson } from '../../../lib/stringifyJson';
import type { T_SupabaseAuthFormState, T_SupabaseAuthPanelProps } from '../../../types.d';

const EMPTY_FORM: T_SupabaseAuthFormState = {
    userId: undefined,
    email: '',
    phone: '',
    password: '',
    userMetadata: '{}',
    appMetadata: '{}',
    emailConfirm: false,
};

export default function SupabaseAuthPanel({ loading, error, users, total, page, perPage, onRefresh, onPageChange, onSave, onDelete }: T_SupabaseAuthPanelProps) {
    const [form, setForm] = React.useState<T_SupabaseAuthFormState>(EMPTY_FORM);
    const [localError, setLocalError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const currentPage = typeof page === 'number' && page > 0 ? page : 1;
    const currentPerPage = typeof perPage === 'number' && perPage > 0 ? perPage : 10;
    const totalUsers = typeof total === 'number' && total > 0 ? total : 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / currentPerPage));
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const rangeStart = totalUsers === 0 ? 0 : ((currentPage - 1) * currentPerPage) + 1;
    const rangeEnd = totalUsers === 0 ? 0 : Math.min(currentPage * currentPerPage, totalUsers);

    const handleSelectUser = (user: T_SupabaseAuthUser) => {
        setForm({
            userId: user.id,
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            userMetadata: stringifyJson(user.user_metadata || {}),
            appMetadata: stringifyJson(user.app_metadata || {}),
            emailConfirm: Boolean(user.email_confirmed_at),
        });
        setLocalError(null);
    };

    const handleNewUser = () => {
        setForm(EMPTY_FORM);
        setLocalError(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setLocalError(null);

        try {
            const email = form.email.trim();
            if (!email) {
                throw new Error('email is required');
            }

            await onSave({
                userId: form.userId,
                email,
                password: form.password.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email_confirm: form.emailConfirm,
                user_metadata: parseJsonRecord(form.userMetadata, 'user_metadata'),
                app_metadata: parseJsonRecord(form.appMetadata, 'app_metadata'),
            });

            if (!form.userId) {
                setForm(EMPTY_FORM);
            }
        } catch (e: unknown) {
            setLocalError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!form.userId) return;
        if (typeof window !== 'undefined' && !window.confirm(`Delete auth user ${form.email || form.userId}?`)) return;

        setSaving(true);
        setLocalError(null);
        try {
            await onDelete(form.userId);
            setForm(EMPTY_FORM);
        } catch (e: unknown) {
            setLocalError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                        <Typography variant="h6">Authenticated Users</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Admin CRUD over Supabase Auth users
                        </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" onClick={handleNewUser}>
                            New user
                        </Button>
                        <Button variant="outlined" size="small" onClick={onRefresh} disabled={loading}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start', flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip size="small" label={`${totalUsers} users`} />
                    <Chip size="small" variant="outlined" label={`Showing ${rangeStart}-${rangeEnd}`} />
                    <Chip size="small" variant="outlined" label={`Page ${currentPage} of ${totalPages}`} />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={loading || !canGoPrevious}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={loading || !canGoNext}
                    >
                        Next
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        10 per page
                    </Typography>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {localError && <Alert severity="error">{localError}</Alert>}

                <Box sx={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id || user.email} hover>
                                    <TableCell>{user.email || user.id || 'Unknown'}</TableCell>
                                    <TableCell>{user.role || 'user'}</TableCell>
                                    <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" onClick={() => handleSelectUser(user)}>
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                <Divider />

                <Stack spacing={1}>
                    <Typography variant="subtitle2">
                        {form.userId ? 'Edit auth user' : 'Create auth user'}
                    </Typography>
                    <TextField
                        label="Email"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    <TextField
                        label="Phone"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                    <TextField
                        label={form.userId ? 'New password (optional)' : 'Password (optional)'}
                        type="password"
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    <TextField
                        label="User metadata JSON"
                        multiline
                        minRows={4}
                        value={form.userMetadata}
                        onChange={(event) => setForm((current) => ({ ...current, userMetadata: event.target.value }))}
                    />
                    <TextField
                        label="App metadata JSON"
                        multiline
                        minRows={4}
                        value={form.appMetadata}
                        onChange={(event) => setForm((current) => ({ ...current, appMetadata: event.target.value }))}
                    />
                    <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={handleSave} disabled={saving}>
                            {form.userId ? 'Update user' : 'Create user'}
                        </Button>
                        <Button color="error" variant="outlined" onClick={handleDelete} disabled={!form.userId || saving}>
                            Delete user
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
}