import { supabaseLogin, supabaseLogout } from './actions/supabaseAuth';
// Components
import SignIn from './components/SignIn';
import AccountCard from './components/AccountCard';
import SimpleSignIn from './components/SimpleSignIn';
import Register from './components/Register';
import ChooseAvatar from './components/ChooseAvatar';
import UserSpot from './components/UserSpot';
import SignOutBtn from './components/SignOutBtn';
import MiniAccount from './components/MiniAccount';
// Actions
import { setPaywall } from './actions/setPaywall';
import { avatarsByUID } from './actions/avatarsByUID';
import { subscribeAccount } from './actions/subscribeAccount';
import { updateAccount } from './actions/updateAccount';
import { login } from './actions/login';
import { logout } from './actions/logout';

// Hooks
import { useUID } from './hooks/useUID';
import { useAuthed } from './hooks/useAuthed';
import { usePaywall } from './hooks/usePaywall';
import { useAccount } from './hooks/useAccount';
import { useIsAuthed } from './hooks/useIsAuthed';
import { useSupabaseAuthListener } from './hooks/useSupabaseAuthListener';



// Components
export {
    SignIn,
    SimpleSignIn,
    SignOutBtn,
    AccountCard,
    Register,
    ChooseAvatar,
    UserSpot,
    MiniAccount,
};

// Actions
export {
    setPaywall,
    avatarsByUID,
    subscribeAccount,
    updateAccount,
    supabaseLogin,
    supabaseLogout,
    login,
    logout,
};

// Hooks
export {
    useUID,
    useAuthed,
    usePaywall,
    useAccount,
    useIsAuthed,
    useSupabaseAuthListener,
};
