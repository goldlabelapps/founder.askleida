"use client";
import React from 'react';
import {useRouter} from 'next/navigation';
import { 
  Typography,
  Grid,
} from '@mui/material';
import { navigateTo, Icon } from '../../NX/DesignSystem';
import { useDispatch } from '../../NX/Uberedux';
import { DashCard } from '../../Leida';


const README = () => {


  
  return (<>
    
    <Typography component="span" variant="h6" sx={{ mb: 1 }}>
      <ul>
        <li>NX° <Icon icon="tick" /></li>
        <ul>
          <li>Design System <Icon icon="tick"  /></li>
        </ul>

        <li>Supabase <Icon icon="tick" /></li>
        <ul>
          <li>Authentication <Icon icon="tick" /></li>
          <li>Postgres Database <Icon icon="tick" /></li>
        </ul>
        <li>Anthropic <Icon icon="tick" /></li>
        <li>Awin <Icon icon="close" color="warning" /></li>
      </ul>
    </Typography>
  </>);
};

export default README;
