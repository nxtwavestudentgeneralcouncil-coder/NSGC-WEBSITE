'use client';

import { NhostProvider } from '@nhost/nextjs';
import { nhost } from '@/lib/nhost';
import { SharedDataProvider } from '@/components/providers/SharedDataProvider';
import { TicketProvider } from '@/lib/ticket-context';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { ProfileGuard } from '@/components/auth/ProfileGuard';
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  split
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';

import { useMemo, useEffect } from 'react';
import Cookies from 'js-cookie';

export function Providers({ children }: { children: React.ReactNode }) {
  // Sync Nhost state to cookies for PASSIVE VERIFICATION in proxy.ts
  useEffect(() => {
    const syncCookies = () => {
      const session = nhost.auth.getSession();
      const authStatus = nhost.auth.getAuthenticationStatus();

      const cookieOptions = {
        expires: 30,
        path: '/',
        sameSite: 'Lax' as const,
        secure: process.env.NODE_ENV === 'production'
      };

      if (session) {
        // Logged In or Token Refreshed - Always sync cookies to be safe
        Cookies.set('nhostRefreshToken', session.refreshToken || '', cookieOptions);
        
        const rolesData = {
          id: session.user?.id,
          email: session.user?.email,
          displayName: session.user?.displayName,
          roles: (session.user as any)?.roles || [],
          defaultRole: session.user?.defaultRole
        };
        Cookies.set('nhostRoles', JSON.stringify(rolesData), cookieOptions);
      } else if (!authStatus.isLoading && !authStatus.isAuthenticated) {
        // Explicitly Logged Out and NO LONGER loading - Safe to remove
        // This prevents deleting cookies during the split-second Nhost initializes on page load
        Cookies.remove('nhostRefreshToken');
        Cookies.remove('nhostRoles');
      }
    };

    // 1. Sync on mount for existing sessions
    syncCookies();

    // 2. Sync on token changes
    const unsubscribe = nhost.auth.onTokenChanged(() => {
      syncCookies();
    });

    return () => unsubscribe();
  }, []);

  const client = useMemo(() => {
    const graphqlUrl = nhost.graphql.url || '';
    
    const httpLink = new HttpLink({
      uri: graphqlUrl
    });

    const authLink = setContext((_, { headers }) => {
      const token = (nhost as any).getAccessToken();
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : ''
        }
      };
    });

    const isBrowser = typeof window !== 'undefined';
    
    // Ensure we don't try to create a WS link with an empty URL
    const wsLink = isBrowser && graphqlUrl
      ? new GraphQLWsLink(
          createClient({
            url: graphqlUrl.replace('http', 'ws'),
            connectionParams: () => ({
              headers: {
                authorization: `Bearer ${(nhost as any).getAccessToken()}`
              }
            })
          })
        )
      : null;

    const link = isBrowser && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          wsLink,
          authLink.concat(httpLink)
        )
      : authLink.concat(httpLink);

    return new ApolloClient({
      link,
      cache: new InMemoryCache(),
      ssrMode: !isBrowser
    });
  }, []);

  return (
    <NhostProvider nhost={nhost as any}>
      <ApolloProvider client={client}>
        <SharedDataProvider>
          <TicketProvider>
            <NotificationProvider>
              <ProfileGuard>
                {children}
              </ProfileGuard>
            </NotificationProvider>
          </TicketProvider>
        </SharedDataProvider>
      </ApolloProvider>
    </NhostProvider>
  );
}
