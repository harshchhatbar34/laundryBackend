'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import '../admin/globals.css';

function ResetPasswordRouterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'fallback'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState('');
  const [webSuccess, setWebSuccess] = useState(false);

  const getAppDeepLink = (dev: 'ios' | 'android' | 'desktop', t: string) => {
    if (dev === 'android') {
      return `intent://set-password?token=${t}#Intent;scheme=laundroflow;package=com.laundroflow.app;end;`;
    }
    return `laundroflow://set-password?token=${t}`;
  };

  useEffect(() => {
    if (!token) return;

    // Detect device platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    let currentDevice: 'ios' | 'android' | 'desktop' = 'desktop';

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      currentDevice = 'ios';
    } else if (/android/i.test(userAgent)) {
      currentDevice = 'android';
    }

    setDevice(currentDevice);

    if (currentDevice !== 'desktop') {
      setStatus('redirecting');
      const targetUrl = getAppDeepLink(currentDevice, token);
      
      // Attempt auto-launch app
      window.location.href = targetUrl;

      const timeout = setTimeout(() => {
        const isPageHidden = document.hidden || (document as any).webkitHidden;
        if (!isPageHidden) {
          setStatus('fallback');
        }
      }, 2500);

      return () => clearTimeout(timeout);
    } else {
      setStatus('fallback');
    }
  }, [token]);

  const handleWebReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebError('');

    if (!password) {
      setWebError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setWebError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setWebError('Passwords do not match.');
      return;
    }

    setWebLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebSuccess(true);
      } else {
        setWebError(data.message || 'Failed to reset password. Link may be expired.');
      }
    } catch (err: any) {
      setWebError(err?.message || 'An unexpected error occurred.');
    } finally {
      setWebLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-qwasho-gradient flex items-center justify-center p-4">
        <div className="admin-card max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-red-500/20 bg-dark-50/90 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <span>⚠️</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">Invalid Link</h2>
            <p className="text-xs text-slate-400 mt-1">This reset link is invalid or incomplete. Please request a new link from the app.</p>
          </div>
        </div>
      </main>
    );
  }

  const appLink = token ? getAppDeepLink(device, token) : '#';

  return (
    <main className="min-h-screen bg-qwasho-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="admin-card max-w-md w-full p-8 shadow-2xl bg-dark-50/80 backdrop-blur-md border border-white/5 space-y-6">
        <div className="text-center">
          <div className="text-center text-5xl">🫧</div>
          <h2 className="font-display font-bold text-xl text-white mt-4">Qwasho Platform</h2>
          <p className="text-xs text-slate-400 mt-1">Smart Laundry Management</p>
        </div>

        {status === 'redirecting' ? (
          <div className="space-y-4 py-6 text-center">
            <Loader2 className="animate-spin text-cyan-400 mx-auto" size={36} />
            <div>
              <p className="text-sm font-semibold text-white">Opening LaundroFlow App...</p>
              <p className="text-xs text-slate-400 mt-1.5">Redirecting to set your new password inside the app.</p>
            </div>
            <a
              href={appLink}
              className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mt-4 text-white text-center"
            >
              <Smartphone size={16} /> Open App Now
            </a>
          </div>
        ) : webSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-base font-bold text-white">Password Reset Successful!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your password has been updated. You can now open the <strong>LaundroFlow</strong> app and log in with your new password.
            </p>
            <a
              href={appLink}
              className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mt-4 text-white text-center"
            >
              <Smartphone size={16} /> Open App & Log In
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {device !== 'desktop' && (
              <a
                href={appLink}
                className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2 text-white text-center"
              >
                <Smartphone size={16} /> Open in LaundroFlow App
              </a>
            )}

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
                <Lock size={16} className="text-cyan-400" />
                <span>Reset Password</span>
              </div>

              {webError ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 mb-3">
                  {webError}
                </div>
              ) : null}

              <form onSubmit={handleWebReset} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={webLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {webLoading ? <Loader2 className="animate-spin" size={14} /> : 'Save New Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordRouterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-qwasho-gradient flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    }>
      <ResetPasswordRouterContent />
    </Suspense>
  );
}
