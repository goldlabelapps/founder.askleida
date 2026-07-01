import * as React from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Collapse,
  Typography,
} from '@mui/material';
import { ConfirmAction, MightyButton } from '../../../index';
import type { T_SelectedProps } from '../../../types.d';

const THUMBNAIL_SIZE = { xs: 96, sm: 120, md: 144 };

export default function Selected({
  selectedRow,
  selectedImageData,
  productDataDraft,
  deletingQueueId,
  processingQueueId,
  confirmDeleteOpen,
  onOpenDeleteConfirm,
  onSaveAndProcess,
  onConfirmDelete,
  onCloseDeleteConfirm,
}: T_SelectedProps) {
  const isDeleting = Boolean(deletingQueueId);
  const isProcessing = Boolean(processingQueueId);
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);

  return (
    <>
      <Card variant="outlined">
        <CardHeader
          title={<Typography variant="h6">{selectedRow.title}</Typography>}
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
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {selectedImageData.priceLabel || 'Price unavailable'}
              </Typography>
              <Typography variant="body2">{selectedImageData.descriptionPreview}</Typography>

              <Box sx={{ mt: 1.5 }}>
                <MightyButton
                  variant="text"
                  icon="api"
                  onClick={() => setShowMoreInfo((value) => !value)}
                >
                  Raw Object
                </MightyButton>

                <Collapse in={showMoreInfo}>
                  <Box sx={{ mt: 0.5 }}>
                            <pre>{JSON.stringify(productDataDraft, null, 2)}</pre>
                  </Box>
                </Collapse>
              </Box>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1,
            }}
          >
            
            <MightyButton
              variant="outlined"
              startIcon="delete"
              fullWidth
              disabled={isDeleting || isProcessing}
              onClick={onOpenDeleteConfirm}
            >
              {isDeleting ? 'Deleting...' : 'Nah, get rid.'}
            </MightyButton>

            <MightyButton
              variant="contained"
              startIcon="ai"
              fullWidth
              disabled={isDeleting || isProcessing}
              onClick={onSaveAndProcess}
            >
              {isProcessing ? 'Processing...' : 'Yes!'}
            </MightyButton>
          </Box>
        </CardActions>


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
