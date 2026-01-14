/**
 * Signup Layout
 * Public layout for invitation-based signup
 * No authentication required
 */

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}
