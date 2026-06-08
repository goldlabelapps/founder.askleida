import { getBaseurl } from './getBaseurl';

export const getEndpoints = (name?: string) => {
    const baseURL = getBaseurl();
    const endpoints = [
        {
            name: 'Affiliate products',
            route: `${baseURL}/products`,
        },
        {
            name: 'AWIN',
            route: `${baseURL}/awin`,
        },
        {
            name: 'Practitioners',
            route: `${baseURL}/practitioners`,
        },
        {
            name: 'Supabase',
            route: `${baseURL}/supabase`,
        }
    ];
    if (name) {
        const found = endpoints.find(e => e.name === name);
        return found || null;
    }
    return endpoints;
};
