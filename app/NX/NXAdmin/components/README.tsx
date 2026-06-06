"use client";
import React from 'react';
import Image from 'next/image';
import { 
  Typography,
  Box,
} from '@mui/material';


const README = () => {

  const imgSrc = 'https://live.staticflickr.com/65535/53669711572_3547fb59b2_b.jpg';
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
        A modular, extensible admin cartridge for NX°.
        It provides a top-level admin component, a barrel export for all features, 
        and a folder structure supporting scalable feature modules.
        TypeScript-first: all modules and types are in TS/TSX.
        Prompts for AI/LLM integrations,
        module currently present.
        For details, see each feature module's README or index file
      </Typography>
    </Box>
  );
};

export default README;