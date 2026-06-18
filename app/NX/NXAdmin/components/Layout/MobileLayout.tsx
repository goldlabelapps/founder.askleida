"use client";
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { styled } from '@mui/material/styles';
import {
    Box,
    Fab,
} from '@mui/material';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { grey } from '@mui/material/colors';
import { useDispatch } from '../../../Uberedux';
import { Icon } from '../../../DesignSystem';
import {
    Header,
    pwaAlert,
    setNXAdmin,
    useNotifications,
    useNXAdmin,
} from '../../../NXAdmin';    
import { DashNav, PageRouter } from '../../../../Leida';
import { NAV_ROUTES, sanitizePath, getActiveFromPathname } from '../PageRouter';

const FALLBACK_ADMIN_BASE_PATH = '/';

interface Props {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window?: () => Window;
    config?: any;
}

const Root = styled('div')(({ theme }) => ({
    height: '100%',
    backgroundColor: grey[100],
    ...theme.applyStyles('dark', {
        backgroundColor: (theme.vars || theme).palette.background.default,
    }),
}));

interface SwipeableEdgeDrawerProps {
    children: React.ReactNode;
    container?: () => HTMLElement;
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
    keepMounted?: boolean;
}

function SwipeableEdgeDrawer(props: SwipeableEdgeDrawerProps) {
    const {
        children,
        container,
        open,
        onClose,
        onOpen,
        keepMounted = true,
    } = props;

    return (
        <SwipeableDrawer
            container={container}
            anchor="top"
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            swipeAreaWidth={0}
            disableSwipeToOpen
            ModalProps={{ keepMounted }}
            PaperProps={{
                sx: {
                    overflow: 'visible',
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                },
            }}
        >
            <Box sx={{ px: 2, pb: 2, height: '100%', overflow: 'auto' }}>{children}</Box>
        </SwipeableDrawer>
    );
}

export default function MobileLayout(props: Props) {
    const { window } = props;
    const dispatch = useDispatch();
    const pathname = usePathname() || FALLBACK_ADMIN_BASE_PATH;
    const nxAdmin = useNXAdmin();
    const { active } = nxAdmin;
    const [open, setOpen] = React.useState(false);

    const openDrawer = React.useCallback(() => setOpen(true), []);
    const closeDrawer = React.useCallback(() => setOpen(false), []);
    const toggleDrawer = React.useCallback(() => setOpen((prev) => !prev), []);

    // This is used only for the example
    const container = window !== undefined ? () => window().document.body : undefined;

    const handleMenuClick = () => {
        toggleDrawer();
    };

    React.useEffect(() => {
        const activeFromPath = getActiveFromPathname(pathname);
        const nextActive = activeFromPath || null;
        if (active !== nextActive) {
            dispatch(setNXAdmin('active', nextActive));
        }
    }, [active, dispatch, pathname]);

    React.useEffect(() => {
        dispatch(pwaAlert());
    }, [dispatch]);

    useNotifications();

    return (
        <Root>
            <Box sx={{ minHeight: '100vh', pb: 8 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Header />
                </Box>
                <Box component="main" sx={{ p: 2 }}>
                    <PageRouter active={active} />
                </Box>
            </Box>
            <Box
                sx={{
                    position: 'fixed',
                    right: 16,
                    top: 'calc(8px + env(safe-area-inset-top))',
                    zIndex: (theme) => theme.zIndex.modal + 1,
                }}
            >
                <Fab
                    sx={{
                        boxShadow: 0,
                    }}
                    color="secondary"
                    aria-label={open ? 'Close NX Admin navigation' : 'Open NX Admin navigation'}
                    onClick={handleMenuClick}
                >
                    <Icon icon={open ? 'close' : 'menu'} />
                </Fab>
            </Box>

            <SwipeableEdgeDrawer
                container={container}
                open={open}
                onClose={closeDrawer}
                onOpen={openDrawer}
                keepMounted
            >
                <Box sx={{ overflow: 'auto' }}>                    
                    <DashNav onNavigate={closeDrawer} />
                </Box>
            </SwipeableEdgeDrawer>
        </Root>
    );
}
