import { NhostClient } from '@nhost/nhost-js';

// Use NhostClient constructor (not createNhostClient) to initialize
// the xstate auth machine required by @nhost/react hooks
export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
  autoSignIn: true,
  autoRefreshToken: true,
});
