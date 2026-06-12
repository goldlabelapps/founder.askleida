'use client';

import * as React from 'react';
import type { Session } from '@supabase/supabase-js';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '../NX/lib/supabase';

const MIN_PASSWORD_LENGTH = 8;

export default function InvitePage() {
    const router = useRouter();
    const [email, setEmail] = React.useState<string | null>(null);
    const [authChecked, setAuthChecked] = React.useState(false);
    const [hasSession, setHasSession] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        let active = true;

        const applySession = (session: Session | null) => {
            if (!active) return;
            setEmail(session?.user?.email ?? null);
            setHasSession(Boolean(session?.user));
            setAuthChecked(true);
            if (session?.user) {
                setError(null);
            }
        };

        const readSession = async () => {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (!active) return;
            if (sessionError) {
                setError(sessionError.message);
            }
            applySession(data.session ?? null);
        };

        void readSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            applySession(session ?? null);
        });

        return () => {
            active = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!hasSession) {
            setError('This invite link is missing or expired. Open the latest invite email and try again.');
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setSaving(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setSuccess('Password set. You can continue into the app now.');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper variant="outlined" sx={{ p: 4 }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Set your password
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Finish accepting your invite by choosing a password for your account.
                        </Typography>
                    </Box>

                    {!authChecked ? (
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">
                                Checking your invite session...
                            </Typography>
                        </Stack>
                    ) : null}

                    {error ? <Alert severity="error">{error}</Alert> : null}
                    {success ? <Alert severity="success">{success}</Alert> : null}

                    {authChecked && !hasSession ? (
                        <Stack spacing={2}>
                            <Alert severity="warning">
                                No active invite session was found. Open the latest invite email, click the link again, and then set your password here.
                            </Alert>
                            <Button variant="outlined" onClick={() => router.push('/')}>
                                Back to sign in
                            </Button>
                        </Stack>
                    ) : null}

                    {authChecked && hasSession ? (
                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <TextField
                                    label="Email"
                                    value={email || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="New password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="new-password"
                                    fullWidth
                                />
                                <TextField
                                    label="Confirm password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    autoComplete="new-password"
                                    fullWidth
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Use at least {MIN_PASSWORD_LENGTH} characters.
                                </Typography>
                                <Stack direction="row" spacing={1.5}>
                                    <Button type="submit" variant="contained" disabled={saving}>
                                        {saving ? 'Saving...' : 'Set password'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        disabled={!success}
                                        onClick={() => router.push('/')}
                                    >
                                        Continue to app
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    ) : null}
                </Stack>
            </Paper>
        </Container>
    );
}
