import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events Calendar',
  description: 'Find out about upcoming events, workshops, and activities happening at NSGC.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
