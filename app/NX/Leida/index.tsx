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
import Awin from './components/Awin/Awin';
import Claude from './components/Claude/Claude';
import Supabase from './components/Supabase/Supabase';
import SupabaseDash from './components/Supabase/components/SupabaseDash';

// Hooks
import { useLeida, useLeidaBus } from './hooks/useLeida';
import { useAwin } from './components/Awin/hooks/useAwin';
import { useClaude } from './components/Claude/hooks/useClaude';

// Actions
import { initLeida } from './actions/initLeida';
import { fetchLeida } from './actions/fetchLeida';
import { setLeida } from './actions/setLeida';
import { initAwin } from './components/Awin/actions/initAwin';
import { setAwin } from './components/Awin/actions/setAwin';
import { initClaude } from './components/Claude/actions/initClaude';
import { setClaude } from './components/Claude/actions/setClaude';
import { submitClaudePrompt } from './components/Claude/actions/submitClaudePrompt';

// Lib
import { normalizeLeidaRouteKey } from './lib/normalizeLeidaRouteKey';

export {
	// Components
	PageRouter,
	DashNav,
	README,
	FounderDash,
	DashCard,
	DashSurface,
	Awin,
	Claude,
	Supabase,
	SupabaseDash,
	// Hooks
	useLeida,
	useLeidaBus,
	useAwin,
	useClaude,
	useDash,
	// Actions
	initLeida,
	initDash,
	initAwin,
	initClaude,
	fetchLeida,
	setLeida,
	setAwin,
	setClaude,
	submitClaudePrompt,
	setDash,
	// Lib
	normalizeLeidaRouteKey,
};
