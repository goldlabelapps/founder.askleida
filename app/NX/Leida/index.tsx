// Components
import { PageRouter } from './PageRouter';
import DashNav from './components/DashNav/DashNav';
import README from './components/README';
import {
	FounderDash,
	initDash,
	useDash,
	setDash,
	DashCard,
	DashSurface,
} from './components/FounderDash';
import DashAuth from './components/FounderDash/components/DashAuth';
import { navItems } from './components/DashNav/navItems';
import Awin from './components/Awin/Awin';
import AwinSearch from './components/Awin/components/AwinSearch';
import Claude from './components/Claude/Claude';
import ClaudePopup from './components/Claude/components/ClaudePopup';
import { PractitionerList, PractitionerCard, PractitionerNew, PractitionerUpdate, Practitioners } from './components/Practitioners';
import Products from './components/Products/Products';
import ProductDash from './components/Products/components/ProductDash';
import ProductCard from './components/Products/components/ProductCard';
import ProductNew from './components/Products/components/ProductNew';
import ProductUpdate from './components/Products/components/ProductUpdate';
import Supabase from './components/Supabase/Supabase';
import SupabasePostgres from './components/Supabase/components/SupabasePostgres';
import SupabaseUsers from './components/Supabase/components/SupabaseUsers';
import SupabaseDash from './components/Supabase/components/SupabaseDash';
import { getLeidaContextPrompt, testProduct } from './components/Claude/prompts';

// Hooks
import { useLeida, useLeidaBus } from './hooks/useLeida';
import { useAwin } from './components/Awin/hooks/useAwin';
import { useClaude } from './components/Claude/hooks/useClaude';

// Actions
import { initLeida } from './actions/initLeida';
import { fetchLeida } from './actions/fetchLeida';
import { setLeida } from './actions/setLeida';
import { deletePractitioner } from './actions/deletePractitioner';
import { deleteProduct } from './actions/deleteProduct';
import { updateProduct } from './actions/updateProduct';
import { updateAvatar } from './components/Practitioners/actions/updateAvatar';
import { createPractitioner } from './components/Practitioners/actions/createPractitioner';
import { updatePractitioner } from './components/Practitioners/actions/updatePractitioner';
import { initSupabase } from './components/Supabase/actions/initSupabase';
import { fetchSupabaseRows } from './components/Supabase/actions/fetchSupabaseRows';
import { saveSupabaseRecord } from './components/Supabase/actions/saveSupabaseRecord';
import { initAwin } from './components/Awin/actions/initAwin';
import { setAwin } from './components/Awin/actions/setAwin';
import { initClaude } from './components/Claude/actions/initClaude';
import { setClaude } from './components/Claude/actions/setClaude';
import { submitClaudePrompt } from './components/Claude/actions/submitClaudePrompt';
import { useSupabase } from './components/Supabase/hooks/useSupabase';

// Lib
import { normalizeLeidaRouteKey } from './lib/normalizeLeidaRouteKey';

export {
	// Components
	PageRouter,
	DashNav,
	navItems,
	README,
	FounderDash,
	DashAuth,
	DashCard,
	DashSurface,
	Awin,
	AwinSearch,
	Claude,
	ClaudePopup,
	PractitionerList,
	PractitionerCard,
	PractitionerNew,
	PractitionerUpdate,
	Practitioners,
	ProductDash,
	ProductCard,
	ProductNew,
	ProductUpdate,
	Products,
	Supabase,
	SupabasePostgres,
	SupabaseUsers,
	SupabaseDash,
	getLeidaContextPrompt,
	testProduct,
	// Hooks
	useLeida,
	useLeidaBus,
	useAwin,
	useClaude,
	useDash,
	useSupabase,
	// Actions
	initLeida,
	initDash,
	initSupabase,
	initAwin,
	initClaude,
	fetchLeida,
	fetchSupabaseRows,
	setLeida,
	setAwin,
	setClaude,
	saveSupabaseRecord,
	submitClaudePrompt,
	deletePractitioner,
	deleteProduct,
	createPractitioner,
	updateAvatar,
	updatePractitioner,
	updateProduct,
	setDash,
	// Lib
	normalizeLeidaRouteKey,
};
