'use client';
import * as React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	IconButton,
	Stack,
	Typography,
	Box,
} from '@mui/material';
import type { I_Icon } from '../../../../NX/types';
import { Icon } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { setLeida } from '../../../../Leida';

export interface I_ClaudePopup {
	open: boolean;
	bodyText: string;
	icon?: I_Icon['icon'];
	title?: string;
}

export default function ClaudePopup({
	open,
	bodyText,
	icon = 'copy',
	title = 'Copy Product Text',
}: I_ClaudePopup) {
	const dispatch = useDispatch();

	const handleClose = React.useCallback(() => {
		dispatch(setLeida('claudePopupOpen', false));
	}, [dispatch]);

	const handleCopy = React.useCallback(async () => {
		const text = typeof bodyText === 'string' ? bodyText.trim() : '';
		if (!text) {
			handleClose();
			return;
		}

		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			handleClose();
			return;
		}

		// Fallback for older browsers where Clipboard API is unavailable.
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		handleClose();
	}, [bodyText, handleClose]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Icon icon={icon} color="primary" />
					<Typography variant="h6">{title}</Typography>
					<Box sx={{ flexGrow: 1 }} />
					<IconButton onClick={handleClose}>
						<Icon icon="close" />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Typography
					component="pre"
					sx={{
						m: 0,
						whiteSpace: 'pre-wrap',
						fontFamily: 'inherit',
					}}
				>
					{bodyText}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} variant="outlined">Cancel</Button>
				<Button
					onClick={handleCopy}
					variant="contained"
					endIcon={<Icon icon="copy" />}
				>
					Copy And Close
				</Button>
			</DialogActions>
		</Dialog>
	);
}
