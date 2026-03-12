/**
 * Admin layout: no employer Header/Footer.
 * Employer is determined by subdomain or ?employer= (set in proxy as x-employer-slug).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
