// Proxy-aware fetch setup.
//
// Node's global fetch (undici) does NOT honor HTTP(S)_PROXY env vars by default.
// In proxied environments (corp networks, this sandbox) that makes every outbound
// call silently fail. Importing this module once at startup routes fetch through
// the configured proxy. NODE_EXTRA_CA_CERTS handles trusting the proxy's CA.

import { setGlobalDispatcher, ProxyAgent } from 'undici';

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;

if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
  console.log(`[http] routing fetch through proxy ${proxy}`);
}
