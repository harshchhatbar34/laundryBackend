'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? 'Login failed');
        return;
      }
      toast.success('Welcome back!');
      router.push('/admin/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-cyan-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-navy-600/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-800 border border-white/10 mb-4 shadow-cyan-sm animate-pulse-cyan">
            <span className="text-3xl">🫧</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Qwasho</h1>
          <p className="text-xs text-cyan-400/80 tracking-widest uppercase font-medium mt-1">
            Smart Laundry Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-navy-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
          <p className="text-sm text-slate-400 mb-6 text-center">
            Sign in to your admin account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="qwasho-label text-slate-400">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@qwasho.com"
                className="qwasho-input bg-navy-800 border-white/10 text-white placeholder:text-slate-600
                           focus:ring-cyan-500/40 focus:border-cyan-500/60"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="qwasho-label text-slate-400">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="qwasho-input bg-navy-800 border-white/10 text-white placeholder:text-slate-600
                             focus:ring-cyan-500/40 focus:border-cyan-500/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold text-sm
                         transition-all duration-150 mt-2 disabled:opacity-60 disabled:cursor-not-allowed
                         shadow-cyan-sm hover:shadow-cyan-md"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Qwasho Platform · Superadmin access only
        </p>
      </div>
    </div>
  );
}
