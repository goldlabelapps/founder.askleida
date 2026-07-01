import * as React from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type ThumbnailProps = {
  src?: string | null;
  alt?: string;
  size?: number;
  borderRadius?: number;
  sx?: SxProps<Theme>;
};

const Thumbnail = ({
  src,
  alt = 'Thumbnail',
  size = 40,
  borderRadius = 1,
  sx,
}: ThumbnailProps) => {
  const normalizedSrc = typeof src === 'string' && src.trim() ? src.trim() : null;

  if (normalizedSrc) {
    return (
      <Box
        component="img"
        src={normalizedSrc}
        alt={alt}
        sx={[
          {
            width: size,
            height: size,
            objectFit: 'cover',
            borderRadius,
            // border: '1px solid',
            // borderColor: 'divider',
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      />
    );
  }

  return (
    <Box
      sx={[
        {
          width: size,
          height: size,
          borderRadius,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
};

export default Thumbnail;
