import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback Hub',
  description: 'Share your thoughts, suggestions, and feedback to help improve campus life.',
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
