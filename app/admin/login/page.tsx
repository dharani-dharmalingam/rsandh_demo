'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter an admin token');
      return;
    }
    document.cookie = `admin_token=${token}; path=/; samesite=strict`;
    const employer = searchParams.get('employer');
    const next = employer ? `/admin?employer=${encodeURIComponent(employer)}` : '/admin';
    router.push(next);
  };

  return (
    <Card className="w-full border-slate-200 bg-white shadow-xl rounded-2xl p-7 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="admin-token" className="text-sm font-medium text-slate-700">
            Admin token
          </Label>
          <Input
            id="admin-token"
            type="password"
            placeholder="Enter your token"
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(''); }}
            className={`h-10 ${error ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200 focus-visible:ring-blue-400'}`}
            autoComplete="current-password"
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <Button
          type="submit"
          className="w-full h-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          Sign in
        </Button>
      </form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="h-full flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-transparent to-indigo-50/50" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Branding above card */}
        <div className="text-center mb-7 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Benefits Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Portal management console</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm">Loading...</span>
          </div>
        }>
          <AdminLoginForm />
        </Suspense>

        <p className="text-center text-xs text-slate-400 mt-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          Secured with token-based authentication
        </p>
      </div>
    </div>
  );
}
