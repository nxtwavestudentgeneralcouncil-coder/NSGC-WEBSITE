import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Marketplace',
  description: 'Buy, sell, and trade items within the student community.',
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
