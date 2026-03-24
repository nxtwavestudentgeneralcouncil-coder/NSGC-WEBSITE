import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'Stay updated with the latest news, notices, and updates from the Student Council.',
};

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
