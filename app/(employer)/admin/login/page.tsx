'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter an admin token');
      return;
    }
    document.cookie = `admin_token=${token}; path=/; samesite=strict`;
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your admin token to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Admin token"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); }}
              className={error ? 'border-red-400' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Continue to Admin
          </Button>
        </form>
      </Card>
    </div>
  );
}
