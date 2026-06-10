// grab the baseURL from the config
export const getBaseurl = () => {
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:2005/api';
    }
    return 'https://founder.askleida.com/api';
};
