import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus Command | Sign Up',
  description: 'Join the NSGC community and access the command center.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
