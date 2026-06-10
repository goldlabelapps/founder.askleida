'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import {
    initClaude,
    setClaude,
    submitClaudePrompt,
    useClaude,
    useLeidaBus,
    useDash,
} from '../../../Leida';
import { setNXAdmin } from '../../../NXAdmin';

export default function Claude() {
    const dispatch = useDispatch();
    const claude = useClaude();
    const bus = useLeidaBus('/api/claude');
    const dash = useDash();

    const prompt = typeof claude?.prompt === 'string' ? claude.prompt : '';
    const loading = Boolean(claude?.loading);
    const error = typeof claude?.error === 'string' ? claude.error : null;
    const response = typeof claude?.response === 'string' ? claude.response : '';
    const model = typeof claude?.model === 'string' ? claude.model : null;

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Claude',
                icon: 'claude',
            }));
        }
    }, [dispatch, dash?.title]);

    React.useEffect(() => {
        if (!claude?.initted) {
            dispatch(initClaude());
        }
    }, [dispatch, claude?.initted]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(submitClaudePrompt());
    };

    const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setClaude('prompt', event.target.value));
    };

    return (
        <Box sx={{ p: 2, maxWidth: 900 }}>
            <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                    {claude?.initted ? 'Claude is initialized.' : 'Connecting to the Claude API'}
                </Typography>

                <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Prompt"
                            placeholder="Ask Claude something..."
                            value={prompt}
                            onChange={handlePromptChange}
                            multiline
                            minRows={4}
                            fullWidth
                            disabled={loading}
                        />
                        <Box>
                            <Button type="submit" variant="contained" disabled={loading || !prompt.trim()}>
                                {loading ? 'Asking Claude...' : 'Send Prompt'}
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                {error ? (
                    <Alert severity="error">{error}</Alert>
                ) : null}

                {response ? (
                    <Paper sx={{ p: 2 }}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Response {model ? `(${model})` : ''}
                            </Typography>
                            <Typography component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                {response}
                            </Typography>
                        </Stack>
                    </Paper>
                ) : null}

                <Typography variant="caption" color="text.secondary">
                    Bus status: {JSON.stringify(bus)}
                </Typography>
            </Stack>
        </Box>
    );
}
