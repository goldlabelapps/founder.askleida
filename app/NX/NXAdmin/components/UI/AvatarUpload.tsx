'use client';
import * as React from 'react';
import {
    Avatar,
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { Icon } from '../../../DesignSystem';

type AvatarUploadProps = {
    practitionerId: string;
    currentAvatar?: string;
    displayName?: string;
    size?: number;
    onSuccess?: (avatarUrl: string) => void;
};

export default function AvatarUpload({
    practitionerId,
    currentAvatar,
    displayName,
    size = 75,
    onSuccess,
}: AvatarUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [preview, setPreview] = React.useState<string | undefined>(currentAvatar);

    React.useEffect(() => {
        setPreview(currentAvatar);
    }, [currentAvatar]);

    const handleClick = () => {
        if (!uploading) inputRef.current?.click();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            setError('Only JPEG, PNG, WebP, or GIF images are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB.');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('practitioner_id', practitionerId);

            const res = await fetch('/api/practitioners/avatar', {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json?.message || 'Upload failed.');
            } else {
                const avatarUrl = json?.data?.avatar_url as string;
                setPreview(avatarUrl);
                onSuccess?.(avatarUrl);
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setUploading(false);
            // Reset input so the same file can be re-selected if needed
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Change avatar" placement="bottom">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Avatar
                        src={preview}
                        alt={displayName ?? 'Avatar'}
                        sx={{ 
                            backgroundColor: 'common.white',
                            width: size, 
                            height: size, 
                            cursor: uploading ? 'default' : 'pointer' 
                        }}
                        onClick={handleClick}
                    >
                        {!preview ? <Icon icon="clients" color="primary" /> : null}
                    </Avatar>

                    <IconButton
                        size="small"
                        onClick={handleClick}
                        disabled={uploading}
                        aria-label="Upload avatar"
                        sx={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            width: 24,
                            height: 24,
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        {uploading
                            ? <CircularProgress size={14} />
                            : <Icon icon="edit" />
                        }
                    </IconButton>
                </Box>
            </Tooltip>

            {error && (
                <Typography variant="caption" color="error" sx={{ maxWidth: 160, textAlign: 'center' }}>
                    {error}
                </Typography>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleChange}
                aria-label="Upload avatar image"
            />
        </Box>
    );
}