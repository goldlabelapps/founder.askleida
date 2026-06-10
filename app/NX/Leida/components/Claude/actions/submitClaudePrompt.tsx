import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../Uberedux';
import { setClaude } from './setClaude';

export const submitClaudePrompt = (): any =>
    async (dispatch: Dispatch, getState: () => any) => {
        const state = getState();
        const claude = state?.redux?.leida?.claude || {};
        const prompt = typeof claude?.prompt === 'string' ? claude.prompt.trim() : '';

        if (!prompt) {
            await dispatch(setClaude('error', 'Please enter a prompt first.'));
            return;
        }

        try {
            await dispatch(setClaude('loading', true));
            await dispatch(setClaude('error', null));
            await dispatch(setClaude('response', ''));

            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch {
                json = null;
            }

            if (!res.ok) {
                const message = json?.message || `Request failed (${res.status})`;
                throw new Error(message);
            }

            const response = typeof json?.data?.response === 'string'
                ? json.data.response
                : 'No text response returned.';
            const model = typeof json?.data?.model === 'string' ? json.data.model : null;

            await dispatch(setClaude('response', response));
            await dispatch(setClaude('model', model));
            await dispatch(setClaude('lastPrompt', prompt));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            await dispatch(setClaude('error', message));
            dispatch(setUbereduxKey({ key: 'error', value: message }));
        } finally {
            await dispatch(setClaude('loading', false));
        }
    };
