// Supabase utilities
import { supabase } from './supabase';

// Tenant & metadata utilities
import { getTenant } from './getTenant';
import { getMeta } from './getMeta';

// Vanilla JS utilities
import { createSlug } from './vanilla-js/createSlug';
import { makeIdentity } from './vanilla-js/makeIdentity';
import { militaryTime } from './vanilla-js/militaryTime';

// Hooks
import { useSupabaseAuthListener } from '../Paywall/hooks/useSupabaseAuthListener';

export {
    // Supabase
    supabase,
    // Tenant & metadata
    getTenant,
    getMeta,
    // Utilities
    createSlug,
    makeIdentity,
    militaryTime,
    // Hooks
    useSupabaseAuthListener,
};
