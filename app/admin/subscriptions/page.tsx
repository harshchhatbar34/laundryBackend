'use client';

import { useState, useMemo, useEffect } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { TopBar } from '@/components/admin/layout/TopBar';
import {
  useSubscriptions, useSubscriptionStats, useMarkSubscriptionPaid,
  useDeleteSubscription, useCreateSubscription, useOwners, useAdminProfile,
} from '@/lib/admin-queries';
import { api } from '@/lib/admin-api';
import { formatCurrency } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, CalendarDays, IndianRupee, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Search, Filter, Download, Plus,
  X, Loader2, User, Building2, Calendar, CreditCard, Eye, QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getStatusColor(status: string, dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  if (status === 'paid') return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25';
  if (status === 'overdue') return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25';
  if (due.getTime() === today.getTime()) return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25';
  return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25';
}

function getStatusDot(status: string, dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  if (status === 'paid') return 'bg-green-500';
  if (status === 'overdue') return 'bg-red-500';
  if (due.getTime() === today.getTime()) return 'bg-blue-500';
  return 'bg-amber-400';
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// ─── Mark Paid Modal ─────────────────────────────────────────────────────────
function MarkPaidModal({ sub, onClose }: { sub: any; onClose: () => void }) {
  const markPaid = useMarkSubscriptionPaid();
  const { data: admin } = useAdminProfile();
  
  const [form, setForm] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: sub.paymentMode || 'cash',
    amount: sub.amount,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markPaid.mutate({ id: sub._id, data: form }, { onSuccess: onClose });
  };

  const upiUrl = admin?.upiId
    ? `upi://pay?pa=${admin.upiId}&pn=${encodeURIComponent("Qwasho Platform")}&am=${form.amount}&cu=INR&tn=${encodeURIComponent(`Sub-${sub.tenantCode}`)}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-surface-border dark:border-dark-border max-w-md w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Record Payment</h3>
          </div>
          <button onClick={onClose} className="qwasho-btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="bg-surface-50 dark:bg-dark-100 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-slate-400">Client</span><span className="font-medium text-slate-800 dark:text-slate-200">{sub.ownerName}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Laundry</span><span className="font-medium text-slate-800 dark:text-slate-200">{sub.laundryName}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Due Date</span><span className="font-medium text-slate-800 dark:text-slate-200">{new Date(sub.dueDate).toLocaleDateString('en-IN')}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="qwasho-label">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              className="qwasho-input" required min={1} />
          </div>
          <div>
            <label className="qwasho-label">Payment Date</label>
            <input type="date" value={form.paidDate} onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
              className="qwasho-input" required max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="qwasho-label">Payment Method</label>
            <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              className="qwasho-input">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {/* Dynamic UPI QR Code */}
          {form.paymentMethod === 'upi' && (
            <div className="border border-surface-border dark:border-dark-border rounded-xl p-4 bg-surface-50 dark:bg-dark-100/50 text-center space-y-3">
              {admin?.upiId ? (
                <>
                  <div className="mx-auto w-[150px] h-[150px] bg-white p-2 rounded-xl border border-slate-100 dark:border-dark-100 flex items-center justify-center shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUrl)}`}
                      alt="UPI QR Code"
                      className="w-[130px] h-[130px] object-contain"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-350">Scan QR Code using any UPI App</p>
                    <p className="font-mono break-all">{admin.upiId}</p>
                  </div>
                </>
              ) : (
                <div className="text-amber-500 dark:text-amber-400 text-xs p-2 space-y-1 leading-normal">
                  <AlertTriangle className="mx-auto mb-1 text-amber-500" size={18} />
                  <p className="font-semibold">UPI ID not configured</p>
                  <p className="text-[10px]">Configure your UPI ID in <Link href="/admin/profile" className="underline font-bold">Profile settings</Link> to generate payment QR code.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="qwasho-label">Notes (Optional)</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="qwasho-input" placeholder="e.g. Reference number" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="qwasho-btn-ghost flex-1 justify-center py-2.5 text-xs">Cancel</button>
            <button type="submit" disabled={markPaid.isPending} className="qwasho-btn-primary flex-1 justify-center py-2.5 text-xs">
              {markPaid.isPending && <Loader2 size={13} className="animate-spin" />} Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Subscription Modal ───────────────────────────────────────────────────
function AddSubscriptionModal({ onClose }: { onClose: () => void }) {
  const createSub = useCreateSubscription();
  const { data: ownersData } = useOwners({ limit: 200 });
  const owners = (ownersData as any)?.data ?? [];

  const [form, setForm] = useState({
    ownerId: '', tenantId: '', subscriptionType: 'monthly', amount: 0, dueDate: new Date().toISOString().split('T')[0],
  });
  const [tenantId, setTenantId] = useState('');

  // When owner selected, fetch their tenant
  const handleOwnerChange = async (ownerId: string) => {
    setForm(f => ({ ...f, ownerId }));
    if (!ownerId) return;
    try {
      const result = await api.getOwner(ownerId);
      const t = (result as any)?.tenant;
      if (t) {
        setTenantId(t._id);
        setForm(f => ({ ...f, amount: t.paymentAmount || 0, subscriptionType: t.subscription === 'onetime' ? 'monthly' : (t.subscription || 'monthly') }));
      }
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { toast.error('Could not find tenant for this owner'); return; }
    createSub.mutate({ ...form, tenantId }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-surface-border dark:border-dark-border max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center">
              <Plus size={16} className="text-cyan-500" />
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Add Subscription Record</h3>
          </div>
          <button onClick={onClose} className="qwasho-btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="qwasho-label">Select Owner</label>
            <select value={form.ownerId} onChange={e => handleOwnerChange(e.target.value)} className="qwasho-input" required>
              <option value="">— Choose Owner —</option>
              {owners.map((o: any) => (
                <option key={o._id} value={o._id}>{o.name} — {o.laundryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="qwasho-label">Subscription Type</label>
            <select value={form.subscriptionType} onChange={e => setForm(f => ({ ...f, subscriptionType: e.target.value }))} className="qwasho-input">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="qwasho-label">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              className="qwasho-input" required min={1} />
          </div>
          <div>
            <label className="qwasho-label">Due Date (Payment Date)</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="qwasho-input" required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="qwasho-btn-ghost flex-1 justify-center py-2.5 text-xs">Cancel</button>
            <button type="submit" disabled={createSub.isPending} className="qwasho-btn-primary flex-1 justify-center py-2.5 text-xs">
              {createSub.isPending && <Loader2 size={13} className="animate-spin" />} Create Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Event Detail Popup ───────────────────────────────────────────────────────
function EventPopup({ sub, onClose, onMarkPaid }: { sub: any; onClose: () => void; onMarkPaid: (s: any) => void }) {
  const deleteSub = useDeleteSubscription();
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(sub.dueDate); due.setHours(0,0,0,0);

  const statusLabel = sub.status === 'paid' ? 'Paid' : sub.status === 'overdue' ? 'Overdue' : due.getTime() === today.getTime() ? 'Due Today' : 'Upcoming';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-50 rounded-2xl border border-surface-border dark:border-dark-border max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Subscription Detail</h3>
          <button onClick={onClose} className="qwasho-btn-ghost p-1.5"><X size={16} /></button>
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${getStatusColor(sub.status, sub.dueDate)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(sub.status, sub.dueDate)}`} />
          {statusLabel}
        </div>

        <div className="space-y-2.5 text-xs mb-5">
          {[
            { icon: User, label: 'Client Name', value: sub.ownerName },
            { icon: Building2, label: 'Laundry Name', value: sub.laundryName },
            { icon: CalendarDays, label: 'Plan', value: sub.subscriptionType.charAt(0).toUpperCase() + sub.subscriptionType.slice(1) },
            { icon: IndianRupee, label: 'Amount', value: formatCurrency(sub.amount) },
            { icon: Calendar, label: 'Due Date', value: new Date(sub.dueDate).toLocaleDateString('en-IN') },
            { icon: Calendar, label: 'Start Date', value: new Date(sub.startDate).toLocaleDateString('en-IN') },
            ...(sub.status === 'paid' && sub.paidMethod
              ? [
                  { icon: CreditCard, label: 'Payment Method', value: sub.paidMethod.toUpperCase() },
                  { icon: Calendar, label: 'Paid Date', value: new Date(sub.paidDate || sub.updatedAt).toLocaleDateString('en-IN') }
                ]
              : sub.paymentMode
                ? [{ icon: CreditCard, label: 'Default Mode', value: sub.paymentMode.toUpperCase() }]
                : []
            ),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 py-1.5 border-b border-surface-border/40 dark:border-dark-border/40 last:border-0">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={12} className="text-cyan-500" />
              </div>
              <span className="text-slate-400 min-w-[90px]">{label}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 ml-auto">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {sub.status !== 'paid' && (
            <button onClick={() => { onClose(); onMarkPaid(sub); }}
              className="qwasho-btn-primary w-full justify-center py-2.5 text-xs">
              <CheckCircle2 size={13} /> Mark as Paid
            </button>
          )}
          <Link href={`/admin/owners/${sub.owner ?? ''}`} onClick={onClose}
            className="qwasho-btn-ghost w-full justify-center py-2.5 text-xs flex items-center gap-1.5">
            <Eye size={13} /> View Owner Profile
          </Link>
          <button onClick={() => {
            deleteSub.mutate(sub._id, { onSuccess: onClose });
          }} className="w-full text-xs text-red-400 hover:text-red-500 py-1.5 flex items-center justify-center gap-1.5 transition-colors">
            Delete Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch ALL subscriptions for the calendar (whole year, no month filter → let client filter by day)
  const { data: subData, isLoading } = useSubscriptions({
    year: calYear,
    ...(filterStatus && { status: filterStatus }),
    ...(filterType && { type: filterType }),
    ...(search && { search }),
    limit: 1000,
  });

  const { data: stats, isLoading: statsLoading } = useSubscriptionStats();

  const records: any[] = (subData as any)?.records ?? [];

  // Group records by day of month for the calendar
  const byDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    records.forEach(r => {
      const d = new Date(r.dueDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [records, calYear, calMonth]);

  if (!mounted) {
    return (
      <AdminShell>
        <TopBar title="Subscription Calendar" subtitle="Track and manage owner subscription renewals" />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="animate-spin text-cyan-500" size={24} />
        </div>
      </AdminShell>
    );
  }

  const calGrid = buildCalendarGrid(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const params: Record<string, string> = { format, year: String(calYear), month: String(calMonth + 1) };
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    if (search) params.search = search;
    const url = api.exportSubscriptions(params);
    window.open(url, '_blank');
  };

  // Summary cards config
  const summaryCards = [
    {
      label: 'Pending This Month',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      amount: (stats as any)?.pendingThisMonth?.amount ?? 0,
      count: (stats as any)?.pendingThisMonth?.count ?? 0,
    },
    {
      label: 'Collected This Month',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      amount: (stats as any)?.collectedThisMonth?.amount ?? 0,
      count: (stats as any)?.collectedThisMonth?.count ?? 0,
    },
    {
      label: 'Upcoming Next Month',
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      amount: (stats as any)?.upcomingNextMonth?.amount ?? 0,
      count: (stats as any)?.upcomingNextMonth?.count ?? 0,
    },
    {
      label: 'Overdue',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      amount: (stats as any)?.overdue?.amount ?? 0,
      count: (stats as any)?.overdue?.count ?? 0,
    },
  ];

  const clientStats = [
    { label: 'Pending Clients',  value: (stats as any)?.pendingClients  ?? 0, color: 'text-amber-500' },
    { label: 'Paid Clients',     value: (stats as any)?.paidClients     ?? 0, color: 'text-green-500' },
    { label: 'Overdue Clients',  value: (stats as any)?.overdueClients  ?? 0, color: 'text-red-500'   },
  ];

  const todayDate = today.getDate();
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  return (
    <AdminShell>
      <TopBar
        title="Subscription Calendar"
        subtitle="Track and manage owner subscription renewals"
        actions={
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="qwasho-btn-ghost text-xs gap-1.5 px-3 py-2">
              <Download size={13} /> CSV
            </button>
            <button onClick={() => handleExport('excel')} className="qwasho-btn-ghost text-xs gap-1.5 px-3 py-2">
              <Download size={13} /> Excel
            </button>
            <button onClick={() => setShowAddModal(true)} className="qwasho-btn-primary text-xs gap-1.5 px-3 py-2">
              <Plus size={13} /> Add Record
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(card => (
            <div key={card.label} className="admin-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon size={15} className={card.color} />
                </div>
                <p className="text-xs text-slate-400 leading-tight">{card.label}</p>
              </div>
              {statsLoading ? (
                <div className="h-7 w-20 bg-surface-100 dark:bg-dark-200 rounded animate-pulse" />
              ) : (
                <>
                  <p className={`text-lg font-display font-bold ${card.color}`}>{formatCurrency(card.amount)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{card.count} record{card.count !== 1 ? 's' : ''}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Client Stats */}
        <div className="admin-card p-4">
          <div className="flex items-center gap-6 flex-wrap">
            {clientStats.map(cs => (
              <div key={cs.label} className="flex items-center gap-2">
                <span className={`text-2xl font-display font-bold ${cs.color}`}>{cs.value}</span>
                <span className="text-xs text-slate-400">{cs.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="qwasho-input pl-8 text-xs py-2" placeholder="Search owner or laundry name…" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            {(['', 'monthly', 'yearly'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterType === t ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500' : 'border-surface-border dark:border-dark-border text-slate-400 hover:border-cyan-500/50'}`}>
                {t === '' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(['', 'pending', 'paid', 'overdue'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterStatus === s ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500' : 'border-surface-border dark:border-dark-border text-slate-400 hover:border-cyan-500/50'}`}>
                {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="admin-card overflow-hidden">
          {/* Month navigator */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-dark-border">
            <button onClick={prevMonth} className="qwasho-btn-ghost p-2"><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-3">
              <CalendarDays size={16} className="text-cyan-500" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">
                {MONTHS[calMonth]} {calYear}
              </h2>
            </div>
            <button onClick={nextMonth} className="qwasho-btn-ghost p-2"><ChevronRight size={16} /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 size={24} className="animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-surface-border dark:bg-dark-border p-0.5">
              {calGrid.map((day, idx) => {
                const events = day ? (byDay[day] ?? []) : [];
                const isToday = isCurrentMonth && day === todayDate;
                return (
                  <div key={idx}
                    className={`min-h-[90px] bg-white dark:bg-dark-50 p-1.5 ${!day ? 'opacity-30' : ''}`}>
                    {day && (
                      <>
                        <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? 'bg-cyan-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev: any) => (
                            <button key={ev._id} onClick={() => setSelectedEvent(ev)}
                              className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate border
                                cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(ev.status, ev.dueDate)}`}>
                              {ev.laundryName}
                            </button>
                          ))}
                          {events.length > 3 && (
                            <p className="text-[9px] text-slate-400 pl-1">+{events.length - 3} more</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-surface-border dark:border-dark-border">
            {[
              { dot: 'bg-green-500', label: 'Paid' },
              { dot: 'bg-amber-400', label: 'Upcoming' },
              { dot: 'bg-blue-500',  label: 'Due Today' },
              { dot: 'bg-red-500',   label: 'Overdue' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventPopup
          sub={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onMarkPaid={(s) => setMarkPaidTarget(s)}
        />
      )}
      {markPaidTarget && (
        <MarkPaidModal sub={markPaidTarget} onClose={() => setMarkPaidTarget(null)} />
      )}
      {showAddModal && (
        <AddSubscriptionModal onClose={() => setShowAddModal(false)} />
      )}
    </AdminShell>
  );
}
