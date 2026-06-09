'use client';
import type { I_NXAdmin } from './types';
import * as React from 'react';
import {
  Box,
  Grid,
  Container,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DesignSystem,
  Feedback,
  useDesignSystem,
} from '../DesignSystem';
import { 
  useSupabaseAuthListener, 
  usePaywall, 
  SimpleSignIn, 
  useIsAuthed,
} from '../Paywall';
import {
  useDispatch,
} from '../Uberedux';
import {
  DesktopLayout,
  MobileLayout,
  README,
  requestNotifications,
} from '../NXAdmin';
import { initLeida, useLeida } from '../Leida';

export type { I_NXAdmin };

export default function NXAdmin({
  config,
}: I_NXAdmin) {
  
  useSupabaseAuthListener();

  const dispatch = useDispatch();
  const paywall = usePaywall();
  const leida = useLeida();
  const isAuthed = useIsAuthed();
  const didInitLeida = React.useRef(false);
  const { authChecked } = paywall || {};
  const designSystem = useDesignSystem();
  const configThemes = config?.cartridges?.designSystem?.themes || {};
  const configDefaultTheme = config?.cartridges?.designSystem?.defaultTheme 
    || 'light';
  const themeMode = (designSystem?.themeMode !== undefined 
      && designSystem?.themeMode !== null)
    ? designSystem.themeMode
    : configDefaultTheme;
  const themeObj = (designSystem?.themes && designSystem?.themes[themeMode])
    || configThemes[themeMode]
    || configThemes[configDefaultTheme];
  const theme = useTheme();
  const isDesktopLayout = useMediaQuery(theme.breakpoints.up('md'), {
    noSsr: true,
  });

  React.useEffect(() => {
    if (!didInitLeida.current) {
      if (!leida || !leida.initted) dispatch(initLeida());
      didInitLeida.current = true;
    }
  }, [dispatch, leida]);


  React.useEffect(() => {
    if (isAuthed) {
      dispatch(requestNotifications());
    }
  }, [isAuthed, dispatch]);

  if (!authChecked) return null;

  return (
    <>
      <DesignSystem config={config} theme={themeObj}>
        <Feedback />
        {!isAuthed ? <>
          <Container 
            maxWidth="md" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '100vh',
            }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box>
                    <SimpleSignIn config={config} /> 
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ mx: 3, mt: 3}}>
                    <README />
                  </Box>
                </Grid>
              </Grid>            
          </Container>
        </>
        : isDesktopLayout
          ? <DesktopLayout config={config} />
          : <MobileLayout config={config} />}
      </DesignSystem>
    </>
  );
}

