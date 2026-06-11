"use client";
import React from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import { 
  Typography,
  Grid,
} from '@mui/material';
import { navigateTo } from '../../DesignSystem';
import { useDispatch } from '../../Uberedux';
import { DashCard } from '../../Leida';


const README = () => {

  const dispatch = useDispatch();
  const router = useRouter();
  const imgSrc = 'https://live.staticflickr.com/65535/55327040507_6ebcd4873b_c.jpg';

  const handleCardClick = (route: string) => {
    dispatch(navigateTo( router, route));
  };

  return (<>
    <Typography variant="h4" sx={{ mb: 2 }}>
      Millie update 11th June 2026
    </Typography>

    <Typography variant="body1" sx={{ mb: 2 }}>
      I would never usually show an app in this state to a client. It'd freak 
      them right out. You're different & might enjoy this glimpse into a half built app.
    </Typography>

    <Image
      src={imgSrc}
      alt="sandbox" width={800} height={600}
      style={{ maxWidth: '100%', height: 'auto', marginBottom: '16px' }} />

    <Typography variant="h5" sx={{ mb: 2 }}>
      Sandbox
    </Typography>
    
    <Typography variant="body1" sx={{ mb: 2 }}>
      A bit like the matrix contruct. We've loaded the NX Admin framework, we're using Supabase Authentication, We've connected the app to
      Anthropic, Awin and Supabase.
    </Typography>


    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashCard
              title="Supabase"
              description="Postgres database and authentication"
              icon={'supabase'}
              cta={() => handleCardClick('/supabase')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DashCard
              title="Awin"
              description="Affiliate marketing data"
              icon={'awin'}
              cta={() => handleCardClick('/awin')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DashCard
              title="Claude"
              description="AI assistant for natural language processing"
              icon={'claude'}
              cta={() => handleCardClick('/claude')}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>


    
  </>);
};

export default README;
