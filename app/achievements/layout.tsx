import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hall of Fame | Achievements',
  description: 'Celebrating excellence and milestones within the NSGC community.',
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
