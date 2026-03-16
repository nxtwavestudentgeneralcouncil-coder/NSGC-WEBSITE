'use client';

import { NhostProvider } from '@nhost/nextjs';
import { NhostApolloProvider } from '@nhost/react-apollo';
import { nhost } from '@/lib/nhost';
import { SharedDataProvider } from '@/components/providers/SharedDataProvider';
import { TicketProvider } from '@/lib/ticket-context';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        <SharedDataProvider>
          <TicketProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </TicketProvider>
        </SharedDataProvider>
      </NhostApolloProvider>
    </NhostProvider>
  );
}
