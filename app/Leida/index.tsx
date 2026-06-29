// Components
import { PageRouter } from './PageRouter';
import {
    Dashboard,
    DashNav,
    navItems,
    LoggedInAs,
    DashAuth,
	initDash,
	useDash,
	setDash,
	DashCard,
	DashSurface,
} from './components/Dashboard';
import AWIN from './components/Products/components/Awin';
import AWINDetail from './components/Products/components/AwinDetail';
import AWINList from './components/Products/components/AwinList';
import AWINProcess from './components/Products/components/AwinProcess';
import Queue from './components/Products/components/Queue';
import Products from './components/Products/Products';
import ListProducts from './components/Products/components/ListProducts';
import RenderProduct from './components/Products/components/RenderProduct';
import FindProduct from './components/Products/components/FindProduct';
import MightyButton from './components/MightyButton/MightyButton';
import ConfirmAction from '../NX/DesignSystem/components/ConfirmAction';
import Editable from '../NX/NXAdmin/components/UI/Editable';
import { LeidaFlash } from './components/LeidaFlash';
import { PractitionerList, PractitionerCard, SurfacePractitioners, PractitionerNew, PractitionerUpdate, Practitioners, usePractitioners } from './components/Practitioners';

// Hooks
import { useLeida, useLeidaBus } from './hooks/useLeida';
import { useFounderAccess } from './hooks/useFounderAccess';
import { useAWIN } from './components/Products/hooks/useAwin';
import { useProducts } from './components/Products/hooks/useProducts';
import { useQueue } from './components/Products/hooks/useQueue';

// Actions
import { initLeida } from './actions/initLeida';
import { fetchLeida } from './actions/fetchLeida';
import { setLeida } from './actions/setLeida';
import { deletePractitioner } from './actions/deletePractitioner';
import { updateAvatar } from './components/Practitioners/actions/updateAvatar';
import { createPractitioner } from './components/Practitioners/actions/createPractitioner';
import { updatePractitioner } from './components/Practitioners/actions/updatePractitioner';
import { initPractitioners } from './components/Practitioners/actions/initPractitioners';
import { initAWIN } from './components/Products/actions/initAwin';
import { setAWIN } from './components/Products/actions/setAwin';
import { fetchAWIN } from './components/Products/actions/fetchAwin';
import { processAWIN } from './components/Products/actions/processAwin';
import { processQueueItem } from './components/Products/actions/processQueueItem';
import { initProducts } from './components/Products/actions/initProducts';
import { fetchProducts } from './components/Products/actions/fetchProducts';
import { initQueue } from './components/Products/actions/initQueue';
import { fetchQueue } from './components/Products/actions/fetchQueue';
import { deleteQueueSelection } from './components/Products/actions/deleteQueueSelection';
import { deleteProductQueueRecords } from './components/Products/actions/deleteProductQueueRecords';
import { fetchAWINFeedIngestPreflight } from './components/Products/actions/fetchAwinFeedIngestPreflight';
import { fetchAWINFeedSnapshot } from './components/Products/actions/fetchAwinFeedSnapshot';
import { setProducts } from './components/Products/actions/setProducts';
import { setQueue } from './components/Products/actions/setQueue';

// Lib
import { normalizeLeidaRouteKey } from './lib/normalizeLeidaRouteKey';
import { loadingMessages, getRandomLoadingMessage } from './lib/loadingMessages';
import { toDayjsOrNull } from './lib/toDayjsOrNull';
import { toHumanDateLabel } from './lib/toHumanDateLabel';
import { textFieldSx } from './lib/textFieldSx';
import { selectMenuItemSx } from './lib/selectMenuItemSx';
import { toLabel } from './lib/toLabel';
import { toDate } from './lib/toDate';
import { parseArrayData } from './lib/parseArrayData';
import { toAccessLevel } from './lib/toAccessLevel';
import { asText } from './lib/asText';
import { asId } from './lib/asId';
import { inferPrice } from './lib/inferPrice';
import { productIdentity } from './lib/productIdentity';
import { productName } from './lib/productName';
import { productCategory } from './lib/productCategory';
import { productDeepLink } from './lib/productDeepLink';
import { productPriceValue } from './lib/productPriceValue';
import { formatUkPrice } from './lib/formatUkPrice';
import { orderByFromSortField } from './lib/orderByFromSortField';
import { sortFieldFromQuery } from './lib/sortFieldFromQuery';
import { toTrimmedText } from './lib/toTrimmedText';
import { getProductName } from './lib/getProductName';
import { getProductCategory } from './lib/getProductCategory';
import { getProductBrand } from './lib/getProductBrand';
import { getProductPrice } from './lib/getProductPrice';
import { getProductUpdatedAt } from './lib/getProductUpdatedAt';
import { includesProductQuery } from './lib/includesProductQuery';
import { getProductPriceLabel } from './lib/getProductPriceLabel';
import { getProductImageUrl } from './lib/getProductImageUrl';
import { getProductCategoryLabel } from './lib/getProductCategoryLabel';
import { isRecord } from './lib/isRecord';
import { parseJsonObject } from './lib/parseJsonObject';
import { getPathValue } from './lib/getPathValue';
import { pickFirstText } from './lib/pickFirstText';
import { normalizeUrl } from './lib/normalizeUrl';
import { findNestedTextByKeys } from './lib/findNestedTextByKeys';
import { getAffiliateTitle } from './lib/getAffiliateTitle';
import { getAffiliateDescription } from './lib/getAffiliateDescription';
import { getAffiliateCategory } from './lib/getAffiliateCategory';
import { getAffiliateImageUrl } from './lib/getAffiliateImageUrl';
import { getAffiliateMerchantLink } from './lib/getAffiliateMerchantLink';
import { getAffiliateProductIdentity } from './lib/getAffiliateProductIdentity';
import { parsePractitionerData } from './lib/parsePractitionerData';
import { formatEstimatedRows } from './lib/formatEstimatedRows';
import { formatNumber } from './lib/formatNumber';
import { stringifyJson } from './lib/stringifyJson';
import { parseJsonRecord } from './lib/parseJsonRecord';
import { isNumericColumn } from './lib/isNumericColumn';
import { isBooleanColumn } from './lib/isBooleanColumn';
import { isJsonColumn } from './lib/isJsonColumn';
import { buildMatch } from './lib/buildMatch';
import { previewValue } from './lib/previewValue';
import { getSupabaseFieldValue } from './lib/getSupabaseFieldValue';
import { parseSupabaseFieldValue } from './lib/parseSupabaseFieldValue';
import { getTableFormPreset } from './lib/getTableFormPreset';
import { normalizeColumnsForPreset } from './lib/normalizeColumnsForPreset';

const AWINSearch = AWIN;
const Awin = AWIN;
const AwinSearch = AWIN;
const Supabase = Dashboard;
const SupabaseUsers = Dashboard;
const SupabasePostgres = Dashboard;
const Claude = Dashboard;

export {
    // Components
    PageRouter,
    DashNav,
    navItems,
    LoggedInAs,
    Dashboard,
    DashAuth,
    DashCard,
    DashSurface,
    AWIN,
    AWINDetail,
    AWINList,
    AWINProcess,
    AWINSearch,
    Awin,
    AwinSearch,
    Supabase,
    SupabaseUsers,
    SupabasePostgres,
    Claude,
    Products,
    Queue,
    ListProducts,
    RenderProduct,
    FindProduct,
    MightyButton,
    ConfirmAction,
    Editable,
    LeidaFlash,
    PractitionerList,
    PractitionerCard,
    SurfacePractitioners,
    PractitionerNew,
    PractitionerUpdate,
    Practitioners,
    usePractitioners,
    // Hooks
    useLeida,
    useLeidaBus,
    useFounderAccess,
    useAWIN,
    useProducts,
    useQueue,
    useDash,
    // Actions
    initLeida,
    initDash,
    initAWIN,
    initProducts,
    fetchProducts,
    initQueue,
    processAWIN,
    processQueueItem,
    fetchAWIN,
    fetchLeida,
    fetchQueue,
    deleteQueueSelection,
    deleteProductQueueRecords,
    fetchAWINFeedIngestPreflight,
    fetchAWINFeedSnapshot,
    setLeida,
    setAWIN,
    setProducts,
    setQueue,
    deletePractitioner,
    createPractitioner,
    updateAvatar,
    updatePractitioner,
    initPractitioners,
    setDash,
    // Lib
    normalizeLeidaRouteKey,
    loadingMessages,
    getRandomLoadingMessage,
    toDayjsOrNull,
    toHumanDateLabel,
    textFieldSx,
    selectMenuItemSx,
    toLabel,
    toDate,
    parseArrayData,
    toAccessLevel,
    asText,
    asId,
    inferPrice,
    productIdentity,
    productName,
    productCategory,
    productDeepLink,
    productPriceValue,
    formatUkPrice,
    orderByFromSortField,
    sortFieldFromQuery,
    toTrimmedText,
    getProductName,
    getProductCategory,
    getProductBrand,
    getProductPrice,
    getProductUpdatedAt,
    includesProductQuery,
    getProductPriceLabel,
    getProductImageUrl,
    getProductCategoryLabel,
    isRecord,
    parseJsonObject,
    getPathValue,
    pickFirstText,
    normalizeUrl,
    findNestedTextByKeys,
    getAffiliateTitle,
    getAffiliateDescription,
    getAffiliateCategory,
    getAffiliateImageUrl,
    getAffiliateMerchantLink,
    getAffiliateProductIdentity,
    parsePractitionerData,
    formatEstimatedRows,
    formatNumber,
    stringifyJson,
    parseJsonRecord,
    isNumericColumn,
    isBooleanColumn,
    isJsonColumn,
    buildMatch,
    previewValue,
    getSupabaseFieldValue,
    parseSupabaseFieldValue,
    getTableFormPreset,
    normalizeColumnsForPreset,
}

export type * from './types';