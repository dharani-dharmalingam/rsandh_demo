'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { urlFor } from '@/sanity/lib/image';

interface HeaderProps {
  logoText?: string;
  clientName?: string;
  shortName?: string;
  clientLogo?: any;
  clientSlug?: string;
  chapters?: any[];
}

export function Header({ logoText, clientName, shortName, clientLogo, clientSlug, chapters = [] }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const displayShortName = shortName || 'RS';
  const displayLogoText = logoText || `${clientName || 'RS&H'} Benefits`;
  const homeLink = clientSlug ? `/${clientSlug}` : '/';

  const logoUrl = clientLogo ? urlFor(clientLogo).url() : null;

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter chapters based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = chapters.filter(ch =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery, chapters]);

  const handleSelectResult = (slug: string) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    router.push(`/${clientSlug}/benefits/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Side - Text Only */}
          <Link href={homeLink} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-none">
              {displayLogoText}
            </span>
          </Link>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search benefits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setIsSearchOpen(true)}
                className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
                <div className="py-2">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Benefit Chapters
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => handleSelectResult(result.slug)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                    >
                      <span className="font-medium text-slate-900">{result.title}</span>
                      {result.description && (
                        <span className="text-xs text-slate-500 line-clamp-1">{result.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSearchOpen && searchQuery.length > 1 && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-500 z-50">
                No benefits found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Right Side - Logo Only */}
          <Link href={homeLink} className="flex items-center gap-2 flex-shrink-0">
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
          </Link>
        </div>
      </div>
    </header>
  );
}
