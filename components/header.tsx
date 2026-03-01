'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { urlFor } from '@/sanity/lib/image';

interface HeaderProps {
  logoText?: string;
  clientName?: string;
  shortName?: string;
  clientLogo?: any;
  clientSlug?: string;
}

export function Header({ logoText, clientName, shortName, clientLogo, clientSlug }: HeaderProps) {
  const displayShortName = shortName || 'RS';
  const displayLogoText = logoText || `${clientName || 'RS&H'} Benefits`;
  const homeLink = clientSlug ? `/${clientSlug}` : '/';

  const logoUrl = clientLogo ? urlFor(clientLogo).url() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Logo */}
          <Link href={homeLink} className="flex items-center gap-2">
            <div className="h-10 w-10 relative flex items-center justify-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={clientName || 'Client Logo'}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{displayShortName.substring(0, 2)}</span>
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-slate-900">
              {displayLogoText}
            </span>
          </Link>

          {/* Center Search Bar */}
          <div className="hidden md:flex flex-1 mx-8 max-w-xs">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search benefits..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Right Logo */}
          <Link href={homeLink} className="flex items-center gap-2">
            <div className="h-10 w-10 relative flex items-center justify-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={clientName || 'Client Logo'}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{displayShortName}</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
