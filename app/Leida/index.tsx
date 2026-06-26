// Components
import { PageRouter } from './PageRouter';
import { DashNav, navItems, LoggedInAs } from './components/DashNav';
import {
	FounderDash,
	initDash,
	useDash,
	setDash,
	DashCard,
	DashSurface,
} from './components/FounderDash';
import DashAuth from './components/FounderDash/components/DashAuth';
import Awin from './components/Awin/Awin';
import AwinDetail from './components/Awin/components/AwinDetail';
import AwinProcess from './components/Awin/components/AwinProcess';
import Products from './components/Products/Products';
import Queue from './components/Products/components/Queue';
import ListProducts from './components/Products/components/ListProducts';
import RenderProduct from './components/Products/components/RenderProduct';
import FindProduct from './components/Products/components/FindProduct';
import { AffiliatePlayer } from './components/AffiliatePlayer';
import MightyButton from './components/MightyButton/MightyButton';
import { LeidaFlash } from './components/LeidaFlash';
import Claude from './components/Claude/Claude';
import ClaudePopup from './components/Claude/components/ClaudePopup';
import { PractitionerList, PractitionerCard, PractitionerNew, PractitionerUpdate, Practitioners, usePractitioners } from './components/Practitioners';
import Supabase from './components/Supabase/Supabase';
import SupabasePostgres from './components/Supabase/components/SupabasePostgres';
import SupabaseUsers from './components/Supabase/components/SupabaseUsers';
import SupabaseDash from './components/Supabase/components/SupabaseDash';
import { getLeidaContextPrompt, testProduct } from './components/Claude/prompts';

// Hooks
import { useLeida, useLeidaBus } from './hooks/useLeida';
import { useFounderAccess } from './hooks/useFounderAccess';
import { useAwin } from './components/Awin/hooks/useAwin';
import { useProducts } from './components/Products/hooks/useProducts';
import { useQueue } from './components/Products/hooks/useQueue';
import { useClaude } from './components/Claude/hooks/useClaude';

// Actions
import { initLeida } from './actions/initLeida';
import { fetchLeida } from './actions/fetchLeida';
import { setLeida } from './actions/setLeida';
import { deletePractitioner } from './actions/deletePractitioner';
import { updateAvatar } from './components/Practitioners/actions/updateAvatar';
import { createPractitioner } from './components/Practitioners/actions/createPractitioner';
import { updatePractitioner } from './components/Practitioners/actions/updatePractitioner';
import { initPractitioners } from './components/Practitioners/actions/initPractitioners';
import { initSupabase } from './components/Supabase/actions/initSupabase';
import { fetchSupabaseRows } from './components/Supabase/actions/fetchSupabaseRows';
import { saveSupabaseRecord } from './components/Supabase/actions/saveSupabaseRecord';
import { initAwin } from './components/Awin/actions/initAwin';
import { setAwin } from './components/Awin/actions/setAwin';
import { processAwin } from './components/Awin/actions/processAwin';
import { initProducts } from './components/Products/actions/initProducts';
import { initQueue } from './components/Products/actions/initQueue';
import { fetchQueue } from './components/Products/actions/fetchQueue';
import { setProducts } from './components/Products/actions/setProducts';
import { setQueue } from './components/Products/actions/setQueue';
import { initClaude } from './components/Claude/actions/initClaude';
import { setClaude } from './components/Claude/actions/setClaude';
import { submitClaudePrompt } from './components/Claude/actions/submitClaudePrompt';
import { useSupabase } from './components/Supabase/hooks/useSupabase';

// Lib
import { normalizeLeidaRouteKey } from './lib/normalizeLeidaRouteKey';
import { loadingMessages, getRandomLoadingMessage } from './lib/loadingMessages';
import { toDayjsOrNull } from './lib/toDayjsOrNull';
import { toHumanDateLabel } from './lib/toHumanDateLabel';
import { textFieldSx } from './lib/textFieldSx';
import { selectMenuItemSx } from './lib/selectMenuItemSx';

const AwinSearch = Awin;

export {
    // Components
    PageRouter,
    DashNav,
    navItems,
    LoggedInAs,
    FounderDash,
    DashAuth,
    DashCard,
    DashSurface,
    Awin,
    AwinDetail,
    AwinProcess,
    AwinSearch,
    Products,
    Queue,
    ListProducts,
    RenderProduct,
    FindProduct,
    AffiliatePlayer,
    MightyButton,
    LeidaFlash,
    Claude,
    ClaudePopup,
    PractitionerList,
    PractitionerCard,
    PractitionerNew,
    PractitionerUpdate,
    Practitioners,
    usePractitioners,
    Supabase,
    SupabasePostgres,
    SupabaseUsers,
    SupabaseDash,
    getLeidaContextPrompt,
    testProduct,
    // Hooks
    useLeida,
    useLeidaBus,
    useFounderAccess,
    useAwin,
    useProducts,
    useQueue,
    useClaude,
    useDash,
    useSupabase,
    // Actions
    initLeida,
    initDash,
    initSupabase,
    initAwin,
    initProducts,
    initQueue,
    initClaude,
    processAwin,
    fetchLeida,
    fetchQueue,
    fetchSupabaseRows,
    setLeida,
    setAwin,
    setProducts,
    setQueue,
    setClaude,
    saveSupabaseRecord,
    submitClaudePrompt,
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
}