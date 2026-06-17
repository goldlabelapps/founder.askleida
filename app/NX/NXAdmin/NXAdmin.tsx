'use client';
import type { I_NXAdmin } from './types';
import * as React from 'react';
import {
  Box,
  Grid,
  Container,
  Button,
  CircularProgress,
  Typography,
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
  logout,
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
import {
  initLeida,
  useFounderAccess,
  useLeida,
  getRandomLoadingMessage,
} from '../Leida';

export type { I_NXAdmin };

export default function NXAdmin({
  config,
}: I_NXAdmin) {
  
  useSupabaseAuthListener();

  const dispatch = useDispatch();
  const paywall = usePaywall();
  const leida = useLeida();
  const isAuthed = useIsAuthed();
  const { isAllowed: hasFounderAccess, isCheckingAccess } = useFounderAccess();
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
    if (isAuthed && hasFounderAccess) {
      dispatch(requestNotifications());
    }
  }, [isAuthed, hasFounderAccess, dispatch]);

  const accessLoadingMessage = React.useMemo(() => {
    if (!isCheckingAccess) return 'Authorising...';
    return getRandomLoadingMessage();
  }, [isCheckingAccess]);

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
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ maxWidth: 300}}>
                    <SimpleSignIn config={config} /> 
                  </Box>
                </Grid>
              </Grid>            
          </Container>
        </>
        : isCheckingAccess
          ? <Container
              maxWidth="sm"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ml: 1}}>
                  {accessLoadingMessage}
                </Typography>
              </Box>
            </Container>
        : !hasFounderAccess
          ? <Container
              maxWidth="sm"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h5">Access denied</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Founder app access is restricted to QA (3) and Founder (4) roles.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      dispatch(logout());
                    }}
                  >
                    Sign out
                  </Button>
                </Grid>
              </Grid>
            </Container>
        : isDesktopLayout
          ? <DesktopLayout config={config} />
          : <MobileLayout config={config} />}
      </DesignSystem>
    </>
  );
}

