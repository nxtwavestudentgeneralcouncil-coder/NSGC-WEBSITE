import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elections Center',
  description: 'Participate in student council elections, view candidates, and cast your vote.',
};

export default function ElectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
