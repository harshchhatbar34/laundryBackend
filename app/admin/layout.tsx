'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { useState, useEffect } from 'react';
import './globals.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  useEffect(() => {
    const handleToastClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Sonner toast elements have the attribute 'data-sonner-toast'
      const toastEl = target.closest('[data-sonner-toast]');
      if (toastEl) {
        const id = toastEl.getAttribute('data-id');
        if (id) {
          toast.dismiss(id);
        } else {
          toast.dismiss();
        }
      }
    };

    // Use capturing phase (true) to ensure click is intercepted
    document.addEventListener('click', handleToastClick, true);
    return () => {
      document.removeEventListener('click', handleToastClick, true);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                style: { cursor: 'pointer' }
              }}
            />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
