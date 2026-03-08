import { NhostClient } from '@nhost/nextjs';

// Fallback to empty strings if not defined to prevent crashing during build before user sets them
export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || ''
});
