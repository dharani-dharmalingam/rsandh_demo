'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

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
    <Card className="w-full max-w-sm border-blue-100 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl opacity-0 animate-fade-up bg-clip-padding" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Benefits Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in with your admin token</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-token" className="text-sm font-medium text-slate-700">
            Admin token
          </Label>
          <Input
            id="admin-token"
            type="password"
            placeholder="Enter your token"
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(''); }}
            className={`h-10 border-blue-100 focus-visible:ring-blue-400 focus-visible:border-blue-300 ${error ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <Button type="submit" className="w-full h-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md transition-all duration-200 hover:shadow-lg">
          Continue
        </Button>
      </form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/80" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Suspense fallback={
          <div className="flex items-center justify-center gap-2 text-slate-600 py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span>Loading...</span>
          </div>
        }>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
