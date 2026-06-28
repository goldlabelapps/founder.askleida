import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Menu,
    MenuItem,
    MobileStepper,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { Icon } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { findNestedTextByKeys } from '../../lib/findNestedTextByKeys';
import { getAffiliateCategory } from '../../lib/getAffiliateCategory';
import { getAffiliateDescription } from '../../lib/getAffiliateDescription';
import { getAffiliateImageUrl } from '../../lib/getAffiliateImageUrl';
import { getAffiliateMerchantLink } from '../../lib/getAffiliateMerchantLink';
import { getAffiliateProductIdentity } from '../../lib/getAffiliateProductIdentity';
import { getAffiliateTitle } from '../../lib/getAffiliateTitle';
import type { AffiliatePlayerProps, T_Product } from '../../types.d';
import { 
    useLeidaBus,
    useProducts,
    initProducts,
    MightyButton,
} from '../../../Leida';

const CARD_HEIGHT = 375;
const SWIPE_THRESHOLD_PX = 50;

const AffiliatePlayer: React.FC<AffiliatePlayerProps> = ({ products, selectedProduct = null }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const productsSlice = useProducts();
    const bus = useLeidaBus('/api/products');
    const [canSwipeByTouch, setCanSwipeByTouch] = React.useState(false);
    const [activeStep, setActiveStep] = React.useState(0);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const touchStartX = React.useRef<number | null>(null);

    React.useEffect(() => {
        dispatch(initProducts());
    }, [dispatch]);

    React.useEffect(() => {
        const touchCapable =
            typeof window !== 'undefined' &&
            ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        setCanSwipeByTouch(touchCapable);
    }, []);

    const productsData = React.useMemo(() => {
        const fromProps = Array.isArray(products) ? products : [];
        const fromSlice = Array.isArray(productsSlice?.products)
            ? (productsSlice.products as T_Product[])
            : [];
        const fromBus = Array.isArray(bus?.data)
            ? (bus.data as T_Product[])
            : [];

        if (fromProps.length > 0) return fromProps;
        if (fromSlice.length > 0) return fromSlice;
        return fromBus;
    }, [products, productsSlice?.products, bus?.data]);

    const maxSteps = productsData.length;
    const enableSwipe = isPhone && canSwipeByTouch && maxSteps > 1;
    const currentProduct = productsData[activeStep];

    React.useEffect(() => {
        if (activeStep > maxSteps - 1) {
            setActiveStep(Math.max(0, maxSteps - 1));
        }
    }, [activeStep, maxSteps]);

    React.useEffect(() => {
        if (!selectedProduct || productsData.length === 0) return;

        const selectedIdentity = getAffiliateProductIdentity(selectedProduct);
        const selectedIndex = productsData.findIndex((product) => {
            if (product === selectedProduct) return true;
            if (!selectedIdentity) return false;
            return getAffiliateProductIdentity(product) === selectedIdentity;
        });

        if (selectedIndex >= 0 && selectedIndex !== activeStep) {
            setActiveStep(selectedIndex);
        }
    }, [selectedProduct, productsData, activeStep]);

    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, maxSteps - 1));
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    const handleMenuToggle = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (!enableSwipe) return;
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    };

    const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (!enableSwipe || touchStartX.current === null) return;

        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const deltaX = touchStartX.current - endX;
        touchStartX.current = null;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
        if (deltaX > 0) handleNext();
        if (deltaX < 0) handleBack();
    };

    if (maxSteps === 0) {
        return (
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Products
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    No products available to display.
                </Typography>
            </Box>
        );
    }

    const title = getAffiliateTitle(currentProduct);
    const description = getAffiliateDescription(currentProduct);
    const category = getAffiliateCategory(currentProduct);
    const imageUrl = getAffiliateImageUrl(currentProduct);
    const merchantLink = getAffiliateMerchantLink(currentProduct);
    const isMenuOpen = Boolean(menuAnchorEl);

    return (
        <Box>

            <Card
                variant="outlined"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                    height: CARD_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Box sx={{ flexGrow: 1 }} />
                    
                    <MightyButton
                        kind="icon"
                        size="large"
                        icon="menu"
                        onClick={handleMenuToggle}
                    />

                </Box>

                <Box
                    sx={{
                        flex: 1,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'stretch',
                        flexDirection: 'row',
                    }}
                >
                    

                    <CardContent
                        sx={{
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            minHeight: 0,
                        }}
                    >
                        <Typography variant="h6">
                            {title}
                        </Typography>

                        <Chip label={category} size="small" sx={{ alignSelf: 'flex-start' }} />

                        <Box
                            sx={{
                                height: 170,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                p: 1.25,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    whiteSpace: 'pre-line',
                                    color: 'text.secondary',
                                    lineHeight: 1.55,
                                }}
                            >
                                {description || 'No description available.'}
                            </Typography>
                        </Box>

                        {/* <Typography variant="caption" sx={{ mt: 'auto' }}>
                            {merchantLink
                                ? 'Use the toggle to open the product menu'
                                : 'No product link available'}
                        </Typography> */}
                    </CardContent>
                </Box>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem disabled>
                        {merchantLink || 'No product link available'}
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>Close</MenuItem>
                </Menu>
            </Card>
            <MobileStepper
                variant="text"
                steps={maxSteps}
                position="static"
                activeStep={activeStep}
                sx={{
                    mt: 1,
                    px: 0,
                    bgcolor: 'transparent',
                }}
                nextButton={
                    <MightyButton 
                        kind="button"
                        endIcon="right"
                        size="large" 
                        onClick={handleNext} 
                        disabled={activeStep === maxSteps - 1}    
                    >
                        Next
                    </MightyButton>
                }
                backButton={
                    <MightyButton 
                        kind="button"
                        startIcon="left"
                        size="large" 
                        onClick={handleBack} 
                        disabled={activeStep === 0}    
                    >
                        Next
                    </MightyButton>
                }
            />
            {/* <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {enableSwipe
                    ? 'Swipe left or right on the card'
                    : 'Use Back/Next buttons'}
            </Typography> */}
        </Box>
    );
};

export default AffiliatePlayer;
