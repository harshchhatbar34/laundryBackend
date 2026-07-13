'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import { useAdminProfile, useUpdateAdminProfile } from '@/lib/admin-queries';
import { formatDateTime, getInitials } from '@/lib/utils';
import { Shield, Mail, Calendar, Loader2, CheckCircle2, User as UserIcon, Pencil } from 'lucide-react';

export default function AdminProfilePage() {
  const { data: admin, isLoading } = useAdminProfile();
  const updateProfile = useUpdateAdminProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', upiId: '' });

  useEffect(() => {
    if (admin) {
      setProfileForm({
        name: admin.name ?? '',
        upiId: admin.upiId ?? '',
      });
    }
  }, [admin]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileForm, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
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

          {/* Account Details */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserIcon size={15} className="text-cyan-500" />
                <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">
                  Account Details
                </h3>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="qwasho-btn-ghost p-1.5 text-slate-400 hover:text-cyan-500"
                  title="Edit details"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="qwasho-label">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="qwasho-input"
                    placeholder="Super Admin"
                    required
                  />
                </div>
                <div>
                  <label className="qwasho-label">UPI ID (For collecting payments from owners)</label>
                  <input
                    type="text"
                    value={profileForm.upiId}
                    onChange={e => setProfileForm(p => ({ ...p, upiId: e.target.value }))}
                    className="qwasho-input font-mono"
                    placeholder="admin@upi"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Owner subscription/payment QR codes will route payments to this UPI address.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (admin) {
                        setProfileForm({
                          name: admin.name ?? '',
                          upiId: admin.upiId ?? '',
                        });
                      }
                    }}
                    className="qwasho-btn-ghost px-4 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="qwasho-btn-primary disabled:opacity-60"
                  >
                    {updateProfile.isPending && <Loader2 size={14} className="animate-spin" />}
                    Save Details
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="py-2.5 border-b border-surface-border/50 dark:border-dark-border/50">
                  <p className="text-xs text-slate-400 font-medium mb-1">Full Name</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {admin?.name ?? '—'}
                  </p>
                </div>
                <div className="py-2.5 last:border-0">
                  <p className="text-xs text-slate-400 font-medium mb-1">UPI ID</p>
                  <p className="text-sm font-mono text-cyan-500">
                    {admin?.upiId ?? 'Not configured — click edit to add'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    UPI address used for generating owner billing QR codes.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
