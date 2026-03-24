import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus Command | Login',
  description: 'Access the NSGC NEXUS command center.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
