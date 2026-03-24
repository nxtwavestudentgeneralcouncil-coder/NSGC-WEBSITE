import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Council Members',
  description: 'Meet the dedicated students serving on the Student General Council.',
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
