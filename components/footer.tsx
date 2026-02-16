import Link from 'next/link';

interface FooterProps {
  clientName?: string;
  about?: string;
  quickLinks?: { label: string; href: string }[];
  contactInfo?: { label: string; value: string; href?: string }[];
  copyrightText?: string;
}

export function Footer({ clientName, about, quickLinks, contactInfo, copyrightText }: FooterProps) {
  const displayClientName = clientName || 'RS&H';
  const currentQuickLinks = quickLinks || [
    { label: 'Benefits Guide', href: '/' },
    { label: 'Enrollment', href: '/enrollment-checklist' },
    { label: 'Support', href: '#' },
  ];

  const currentContactInfo = contactInfo || [
    { label: 'Benefits Phone', value: '(555) 123-4567' },
    { label: 'Benefits Email', value: `benefits@${displayClientName.toLowerCase().replace(/\s+/g, '')}.com`, href: '#' },
    { label: 'HR Portal', value: `portal.${displayClientName.toLowerCase().replace(/\s+/g, '')}.com`, href: '#' },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Client Name */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{displayClientName}</h3>
            <p className="text-sm text-slate-600">
              {about || `Comprehensive benefits administration and support for the valued employees of ${displayClientName}.`}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Quick Links</h4>
            <nav className="space-y-2">
              {currentQuickLinks.map((link) => (
                <div key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Contact</h4>
            <div className="space-y-2">
              {currentContactInfo.map((info) => (
                <div key={info.label}>
                  {info.href ? (
                    <a href={info.href} className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                      {info.label}: {info.value}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {info.label}: {info.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <p className="text-xs text-slate-600 text-center">
            {copyrightText || `© ${new Date().getFullYear()} ${displayClientName}. All rights reserved. Benefits information is confidential.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
