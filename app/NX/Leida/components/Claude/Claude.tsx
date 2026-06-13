'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { Icon } from '../../../DesignSystem';
import {
    initClaude,
    setClaude,
    setLeida,
    submitClaudePrompt,
    useClaude,
    getLeidaContextPrompt,
    testProduct,
    ClaudePopup,
    useLeida,
    useDash,
} from '../../../Leida';
import { setNXAdmin } from '../../../NXAdmin';
import ClaudePromptAccordion from './components/ClaudePromptAccordion';

export default function Claude() {
    const dispatch = useDispatch();
    const claude = useClaude();
    const leida = useLeida();
    const dash = useDash();
    const popupOpen = Boolean(leida?.claudePopupOpen);

    const prompt = typeof claude?.prompt === 'string' ? claude.prompt : '';
    const loading = Boolean(claude?.loading);
    const error = typeof claude?.error === 'string' ? claude.error : null;
    const response = typeof claude?.response === 'string' ? claude.response : '';
    const model = typeof claude?.model === 'string' ? claude.model : null;
    const hasResponse = Boolean(response.trim());
    const hasSubmittedPrompt = Boolean(
        (typeof claude?.lastPrompt === 'string' && claude.lastPrompt.trim()) ||
        loading ||
        response,
    );

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

    const handleClearStartOver = () => {
        dispatch(setClaude('prompt', ''));
        dispatch(setClaude('response', ''));
        dispatch(setClaude('model', null));
        dispatch(setClaude('error', null));
        dispatch(setClaude('lastPrompt', ''));
        dispatch(setClaude('loading', false));
    };

    if (error){
        return <>
            <Alert severity="error">{error}</Alert>
        </>
    }

    return (
        <Box sx={{  }}>

                {hasResponse ? (
                    <Box sx={{ mb: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            endIcon={<Icon icon="reset" />}
                            onClick={handleClearStartOver}
                        >
                            Clear And Start Over
                        </Button>
                    </Box>
                ) : null}

            
                

                <Typography variant="body2" color="text.secondary">
                    {claude?.initted ? '' : 'Connecting to the Claude API'}
                </Typography>

                {!hasSubmittedPrompt ? (
                    <Paper variant="outlined"
                     component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>

                    <Typography variant="body1" sx={{my:2, }}>
                        Paste a product description here. Example: <IconButton
                            color="primary"
                            onClick={() => dispatch(setLeida('claudePopupOpen', true))}
                        >
                            <Icon icon="doc" />
                        </IconButton>
                    </Typography>

                    <ClaudePromptAccordion
                        title="What we send"
                        content={getLeidaContextPrompt(prompt)}
                    />

                        <Stack spacing={2} sx={{mt: 2}}>
                            <TextField
                                placeholder="Paste product description here..."
                                value={prompt}
                                onChange={handlePromptChange}
                                multiline
                                minRows={4}
                                fullWidth
                                disabled={loading}
                            />
                            <Box>
                                <Button
                                    fullWidth
                                    endIcon={<Icon icon="send" />}
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || !prompt.trim()}>
                                    {loading ? 'Asking Claude...' : 'Send Prompt'}
                                </Button>
                            </Box>
                        </Stack>
                    </Paper>
                ) : null}

                {loading ? (
                    <Paper sx={{ p: 2 }}>
                        <Stack spacing={1.5}>
                            <Typography variant="body1">
                                Working on it. Leida is analyzing your product details now.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This usually takes a few seconds.
                            </Typography>
                            <LinearProgress />
                        </Stack>
                    </Paper>
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

                


            <ClaudePopup
                open={popupOpen}
                icon="copy"
                title="Copy Test Product"
                bodyText={testProduct}
            />
        </Box>
    );
}
