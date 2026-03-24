import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campus Life | Gallery',
  description: 'Capturing moments and memories that define our journey at NSGC.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
