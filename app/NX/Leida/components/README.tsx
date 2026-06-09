"use client";
import React from 'react';
import Image from 'next/image';
import { 
  Typography,
  Box,
} from '@mui/material';
import { useLeida, useLeidaBus } from '../../Leida';


const README = () => {
  const bus = useLeidaBus('/api/supabase') || [];

  return (
    <Box sx={{  }}>
      {/* <pre>
        bus: {JSON.stringify(bus, null, 2)}
      </pre> */}
    </Box>
  );
};

export default README;

/* 
  const imgSrc = 'https://live.staticflickr.com/65535/55111661741_6844b1cc48_b.jpg';
  const OG_WIDTH = 1200;
  const OG_HEIGHT = 630;
<Box
  sx={{
    mb: 2,
    width: '100%',
    aspectRatio: `${OG_WIDTH} / ${OG_HEIGHT}`,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
  }}
>
  <Image
    src={imgSrc}
    alt="NX°"
    fill
    sizes="100vw"
    priority
    style={{
      objectFit: 'cover',
    }}
  />
</Box>


      <Typography variant="h6" sx={{mb:2}}>
        Work In Progress
      </Typography>


*/