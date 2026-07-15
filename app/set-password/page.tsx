'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, Smartphone } from 'lucide-react';
import '../admin/globals.css';

// Configure store URLs (user can adjust these later or we load from env if needed)
const PLAY_STORE_URL = 'https://play.google.com/store'; 
const APP_STORE_URL = 'https://apps.apple.com';

function SetPasswordRouterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'fallback'>('checking');

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
    setStatus('redirecting');

    const deepLink = `laundroflow://set-password?token=${token}`;
    const storeLink = currentDevice === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

    if (currentDevice === 'desktop') {
      // For desktop, we don't auto-redirect, we show a screen with QR code/instructions
      setStatus('fallback');
      return;
    }

    // Try to open the app
    window.location.href = deepLink;

    // Set a timeout to redirect to the app store if the app doesn't open
    const timeout = setTimeout(() => {
      // Check if browser is still active (if app opened, browser would be in background/hidden)
      const isPageHidden = document.hidden || (document as any).webkitHidden;
      if (!isPageHidden) {
        window.location.href = storeLink;
        setStatus('fallback');
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [token]);

  const handleManualStoreRedirect = () => {
    const storeLink = device === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    window.location.href = storeLink;
  };

  const handleManualAppRetry = () => {
    if (token) {
      window.location.href = `laundroflow://set-password?token=${token}`;
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
            <p className="text-xs text-slate-400 mt-1">This setup link is invalid or incomplete. Please request a new setup link from your super administrator.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-qwasho-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="admin-card max-w-md w-full p-8 shadow-2xl bg-dark-50/80 backdrop-blur-md border border-white/5 text-center space-y-6">
        <div>
          <div className="text-center text-5xl">🫧</div>
          <h2 className="font-display font-bold text-xl text-white mt-4">Qwasho Platform</h2>
          <p className="text-xs text-slate-400 mt-1">Smart Laundry Management</p>
        </div>

        {status === 'redirecting' ? (
          <div className="space-y-4 py-6">
            <Loader2 className="animate-spin text-cyan-400 mx-auto" size={36} />
            <div>
              <p className="text-sm font-semibold text-white">Opening LaundroFlow App...</p>
              <p className="text-xs text-slate-400 mt-1.5">We are redirecting you to configure your password.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto text-cyan-400">
              <Smartphone size={32} />
            </div>

            {device === 'desktop' ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Mobile Device Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Please open this configuration link on your **Android or iOS smartphone** to set up your password inside the <strong>LaundroFlow</strong> app.
                </p>
                <div className="pt-2">
                  <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-slate-300 select-all font-mono break-all block">
                    {window.location.href}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">App Not Installed?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If the LaundroFlow app didn't open automatically, you may need to download it from the store first.
                </p>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleManualStoreRedirect}
                    className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                  >
                    <Download size={14} /> Download App
                  </button>

                  <button
                    onClick={handleManualAppRetry}
                    className="w-full justify-center py-2.5 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-all"
                  >
                    Retry Opening App
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SetPasswordRouterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-qwasho-gradient flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </main>
    }>
      <SetPasswordRouterContent />
    </Suspense>
  );
}
