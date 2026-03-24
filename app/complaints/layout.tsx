import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complaints Portal',
  description: 'Submit and track your complaints or issues to the Student Council.',
};

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
