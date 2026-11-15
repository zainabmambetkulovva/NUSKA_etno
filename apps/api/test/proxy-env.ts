// Must be imported before the app module: the config is validated at import time.
export const PROXY_SECRET = 'e2e-proxy-secret-0123456789-abcdefghijkl';
process.env.PROXY_SECRET = PROXY_SECRET;
process.env.THROTTLE_DISABLED = 'false';
