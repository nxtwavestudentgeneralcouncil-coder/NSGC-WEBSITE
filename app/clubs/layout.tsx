import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Clubs',
  description: 'Explore and join various student-run clubs and communities at NSGC.',
};

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
