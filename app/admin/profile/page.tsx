'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { useAdminProfile } from '@/lib/admin-queries';
import { formatDateTime, getInitials } from '@/lib/utils';
import { Shield, Mail, Calendar, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/admin-api';

export default function AdminProfilePage() {
  const { data: admin, isLoading } = useAdminProfile();

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setPwLoading(true);
      await adminApi.patch('/api/admin-auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      toast.success('Password changed successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AdminShell>
      <TopBar title="My Profile" subtitle="Super Admin account details" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile Card */}
          <div className="admin-card p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(admin?.name ?? 'SA')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-bold text-slate-900 dark:text-white text-xl">
                      {admin?.name ?? 'Super Admin'}
                    </h2>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500">
                      <Shield size={10} /> Superadmin
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail size={13} className="text-cyan-500" />
                      <span>{admin?.email ?? '—'}</span>
                    </div>
                    {admin?.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={13} className="text-cyan-500" />
                        <span>Member since {formatDateTime(admin.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active badge */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full flex-shrink-0">
                  <CheckCircle2 size={12} />
                  Active
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="admin-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound size={15} className="text-cyan-500" />
              <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">
                Change Password
              </h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="qwasho-label">Current Password</label>
                <input
                  type="password"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  className="qwasho-input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="qwasho-label">New Password</label>
                  <input
                    type="password"
                    value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    className="qwasho-input"
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
                <div>
                  <label className="qwasho-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="qwasho-input"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="qwasho-btn-primary disabled:opacity-60"
                >
                  {pwLoading && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Session info */}
          <div className="admin-card p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Session</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Role</span>
                <span className="font-mono text-cyan-500 capitalize">{admin?.role ?? 'superadmin'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-xs text-slate-500 truncate ml-4">{admin?._id ?? '—'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
