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

type T_Props = {
    loading?: boolean;
    error?: string | null;
    users: T_SupabaseAuthUser[];
    total?: number;
    onRefresh: () => void;
    onSave: (args: {
        userId?: string;
        email: string;
        password?: string;
        phone?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
    }) => Promise<void>;
    onDelete: (userId: string) => Promise<void>;
};

type T_FormState = {
    userId?: string;
    email: string;
    phone: string;
    password: string;
    userMetadata: string;
    appMetadata: string;
    emailConfirm: boolean;
};

const EMPTY_FORM: T_FormState = {
    userId: undefined,
    email: '',
    phone: '',
    password: '',
    userMetadata: '{}',
    appMetadata: '{}',
    emailConfirm: false,
};

function stringifyJson(value: unknown): string {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    } catch {
        return '{}';
    }
}

function parseJson(text: string, label: string): Record<string, any> {
    const parsed = JSON.parse(text || '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`${label} must be a JSON object`);
    }
    return parsed;
}

export default function SupabaseAuthPanel({ loading, error, users, total, onRefresh, onSave, onDelete }: T_Props) {
    const [form, setForm] = React.useState<T_FormState>(EMPTY_FORM);
    const [localError, setLocalError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

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
                user_metadata: parseJson(form.userMetadata, 'user_metadata'),
                app_metadata: parseJson(form.appMetadata, 'app_metadata'),
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

                <Chip size="small" label={`${total || 0} users`} sx={{ alignSelf: 'flex-start' }} />

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