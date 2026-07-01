'use client';
import * as React from 'react';
import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';

type T_BlockingOverlayProps = {
  open: boolean;
  label?: string;
};

export default function BlockingOverlay({
  open,
  label = 'Loading...',
}: T_BlockingOverlayProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 10,
        position: 'fixed',
        bgcolor: 'rgba(0, 0, 0, 0.72)',
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <CircularProgress sx={{ color: 'common.white' }} />
        <Typography variant="overline" sx={{ color: 'common.white' }}>
          {label}
        </Typography>
      </Stack>
    </Backdrop>
  );
}
