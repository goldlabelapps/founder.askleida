import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
} from '@mui/material';
import { ConfirmAction, MightyButton } from '../../../index';
import type { T_SelectedProps } from '../../../types.d';

const THUMBNAIL_SIZE = { xs: 96, sm: 120, md: 144 };

export default function Selected({
  selectedRow,
  selectedImageData,
  deletingQueueId,
  confirmDeleteOpen,
  onOpenDeleteConfirm,
  onConfirmDelete,
  onCloseDeleteConfirm,
}: T_SelectedProps) {
  return (
    <>
      <Card variant="outlined">
        <CardHeader
          title={<Typography variant="h6">{selectedRow.title}</Typography>}
          action={(
            <MightyButton
              kind="icon"
              icon="delete"
              disabled={Boolean(deletingQueueId)}
              onClick={onOpenDeleteConfirm}
            />
          )}
        />

        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {selectedImageData.displayImageUrl ? (
              <CardMedia
                component="img"
                image={selectedImageData.displayImageUrl}
                alt={selectedRow.title}
                sx={{
                  width: THUMBNAIL_SIZE,
                  height: THUMBNAIL_SIZE,
                  borderRadius: 1,
                  objectFit: 'cover',
                  bgcolor: 'background.default',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: THUMBNAIL_SIZE,
                  height: THUMBNAIL_SIZE,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  No image
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                minWidth: 0,
                flexGrow: 1,
              }}
            >
              <Typography variant="body2">{selectedImageData.descriptionPreview}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ConfirmAction
        open={confirmDeleteOpen}
        icon="delete"
        title="Delete this queue item?"
        body="This action cannot be undone."
        handleConfirm={onConfirmDelete}
        handleClose={onCloseDeleteConfirm}
      />
    </>
  );
}
