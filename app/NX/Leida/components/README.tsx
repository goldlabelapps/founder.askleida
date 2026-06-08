"use client";
import React from 'react';
import Image from 'next/image';
import { 
  Typography,
  Box,
} from '@mui/material';


const README = () => {

  const imgSrc = 'https://askleida.com/assets/millie.png';
  const OG_WIDTH = 1200;
  const OG_HEIGHT = 630;

  return (
    <Box sx={{  }}>
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
        Here comes the science bit
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>

      </Typography>
    </Box>
  );
};

export default README;