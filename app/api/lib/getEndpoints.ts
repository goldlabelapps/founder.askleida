import { getBaseurl } from './getBaseurl';

export const getEndpoints = (name?: string) => {
    const baseURL = getBaseurl();
    const endpoints = [
        {
            name: 'Affiliate products',
            route: `${baseURL}/products`,
        },
        {
            name: 'Practitioners',
            route: `${baseURL}/practitioners`,
        }
    ];
    if (name) {
        const found = endpoints.find(e => e.name === name);
        return found || null;
    }
    return endpoints;
};
