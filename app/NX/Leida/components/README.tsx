"use client";
import React from 'react';
import Image from 'next/image';
import { 
  Typography,
  Box,
} from '@mui/material';
import {useLeida} from '../../Leida';


const README = () => {

  const imgSrc = 'https://live.staticflickr.com/65535/55111661741_6844b1cc48_b.jpg';
  const OG_WIDTH = 1200;
  const OG_HEIGHT = 630;

  const leida = useLeida();

  return (
    <Box sx={{  }}>


      <pre>
        {JSON.stringify(leida, null, 2)}
      </pre>

      {/* <Box
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
      </Box> */}
      <Typography variant="h6" sx={{mb:2}}>
        Work In Progress
      </Typography>
      <Typography component={"span"} variant="body1" sx={{ mb: 2 }}>
          <ul>


          <li>Fetch the endpoint<br />

            useEffect as a React developer. treat this endpoint as a healthcheck. if it's not working, here's where we need to know
          </li>

          <li>Fetch the endpoint<br />

            useEffect as a React developer. treat this endpoint as a healthcheck. if it's not working, here's where we need to know
          </li>


          <li>Display the supabase tables<br />

            as a list
          </li>

          </ul>
      </Typography>
    </Box>
  );
};

export default README;