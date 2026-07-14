'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCreateOwner, useUpdateOwner, useAdminProfile } from '@/lib/admin-queries';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  name:          z.string().min(2, 'Name required'),
  email:         z.string().email('Valid email required'),
  password:      z.string().optional(),
  mobileNumber:  z.string().min(10, 'Valid mobile required'),
  laundryName:   z.string().min(2, 'Laundry name required'),
  address:       z.string().optional(),
  city:          z.string().optional(),
  state:         z.string().optional(),
  pincode:       z.string().optional(),
  subscription:  z.enum(['monthly', 'yearly', 'onetime']).default('monthly'),
  paymentAmount: z.number().min(0).optional(),
  paymentMode:   z.enum(['cash', 'upi']).optional(),
  upiId:         z.string().optional(),
  photo:         z.string().optional(),
});
type OwnerForm = z.infer<typeof schema>;

interface OwnerFormSheetProps {
  open: boolean;
  onClose: () => void;
  owner?: OwnerForm & { _id?: string } | null;
}

const SUBS = ['monthly', 'yearly', 'onetime'] as const;

export function OwnerFormSheet({ open, onClose, owner }: OwnerFormSheetProps) {
  const isEdit = !!owner?._id;
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  const { data: admin } = useAdminProfile();
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<OwnerForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: { subscription: 'monthly', paymentMode: 'cash' },
  });

  const subscription = watch('subscription');
  const paymentMode  = watch('paymentMode');
  const paymentAmount = watch('paymentAmount');

  useEffect(() => {
    if (owner && open) {
      reset({ ...owner, password: '' });
      setPreview((owner as any).photo || null);
    } else if (!owner && open) {
      reset({ subscription: 'monthly', paymentMode: 'cash' });
      setPreview(null);
    }
    setCreatedLink(null);
  }, [owner, open, reset]);

  const onSubmit = async (data: OwnerForm) => {
    const payload = { ...data };
    if (isEdit && !payload.password) delete payload.password;

    if (isEdit && owner?._id) {
      await updateOwner.mutateAsync({ id: owner._id, data: payload });
      onClose();
    } else {
      const result = await createOwner.mutateAsync(payload);
      const link = (result as any)?.data?.setupLink;
      if (link) {
        setCreatedLink(link);
      } else {
        onClose();
      }
    }
  };

  const handleClose = () => {
    setCreatedLink(null);
    onClose();
  };

  if (createdLink) {
    return (
      <>
        {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleClose} />}
        <div className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-50 shadow-2xl z-50',
          'flex flex-col border-l border-surface-border dark:border-dark-border',
          'transition-transform duration-300 translate-x-0'
        )}>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 ring-4 ring-cyan-500/5 animate-bounce">
              <ShieldCheck size={36} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Owner Created!</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                A password setup link has been generated. Share this link with the owner so they can set up their password.
              </p>
            </div>

            <div className="w-full bg-surface-50 dark:bg-dark-100 p-3 rounded-xl border border-surface-border dark:border-dark-border select-all font-mono text-[10px] break-all text-slate-600 dark:text-slate-300 text-left">
              {createdLink}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(createdLink);
                toast.success('Link copied to clipboard!');
              }}
              className="qwasho-btn-primary w-full justify-center py-2.5 text-xs font-semibold"
            >
              Copy Setup Link
            </button>

            <button onClick={handleClose} className="qwasho-btn-ghost w-full justify-center py-2.5 text-xs">
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleClose} />}

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-50 shadow-2xl z-50',
        'flex flex-col border-l border-surface-border dark:border-dark-border',
        'transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-dark-border">
          <div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Owner' : 'New Owner'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{isEdit ? 'Update owner details' : 'Create a new shop owner account'}</p>
          </div>
          <button onClick={handleClose} className="qwasho-btn-ghost p-2"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-2 border-surface-border dark:border-dark-border bg-slate-50 dark:bg-dark-100 flex items-center justify-center overflow-hidden shadow-inner">
                {preview ? (
                  <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 text-2xl">
                    📷
                  </div>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                Change
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setPreview(base64);
                        setValue('photo', base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Upload Owner Photo (Optional)</p>
          </div>

          {/* Personal */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Personal Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="qwasho-label">Full Name</label>
              <input {...register('name')} className="qwasho-input" placeholder="Raj Kumar" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="qwasho-label">Email</label>
              <input {...register('email')} type="email" className="qwasho-input" placeholder="raj@shop.com" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="qwasho-label">Mobile</label>
              <input {...register('mobileNumber')} className="qwasho-input" placeholder="9876543210" />
              {errors.mobileNumber && <p className="text-red-400 text-xs mt-1">{errors.mobileNumber.message}</p>}
            </div>
            {isEdit && (
              <div className="col-span-2">
                <label className="qwasho-label">Password <span className="normal-case font-normal text-slate-400">(leave blank to keep)</span></label>
                <input {...register('password')} type="password" className="qwasho-input" placeholder="••••••••" />
              </div>
            )}
          </div>

          {/* Shop */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-2">Shop Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="qwasho-label">Laundry Name</label>
              <input {...register('laundryName')} className="qwasho-input" placeholder="Sparkle Laundry" />
              {errors.laundryName && <p className="text-red-400 text-xs mt-1">{errors.laundryName.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="qwasho-label">Address</label>
              <input {...register('address')} className="qwasho-input" placeholder="123 Main Street" />
            </div>
            <div>
              <label className="qwasho-label">City</label>
              <input {...register('city')} className="qwasho-input" placeholder="Mumbai" />
            </div>
            <div>
              <label className="qwasho-label">State</label>
              <input {...register('state')} className="qwasho-input" placeholder="Maharashtra" />
            </div>
            <div>
              <label className="qwasho-label">Pincode</label>
              <input {...register('pincode')} className="qwasho-input" placeholder="400001" />
            </div>
            <div className="col-span-2">
              <label className="qwasho-label">Owner UPI ID (for customer payments)</label>
              <input {...register('upiId')} className="qwasho-input" placeholder="owner@upi" />
            </div>
          </div>

          {/* Subscription */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-2">Subscription</p>
          <div className="flex gap-2">
            {SUBS.map(s => (
              <button
                key={s} type="button"
                onClick={() => setValue('subscription', s)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  subscription === s
                    ? 'bg-cyan-500 text-navy-950 border-cyan-500'
                    : 'border-surface-border dark:border-dark-border text-slate-500 dark:text-slate-400 hover:border-cyan-500/40'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="qwasho-label">Fee (₹)</label>
              <input {...register('paymentAmount', { valueAsNumber: true })} type="number" className="qwasho-input" placeholder="999" />
            </div>
            <div>
              <label className="qwasho-label">Payment Mode</label>
              <div className="flex gap-2">
                {(['cash', 'upi'] as const).map(p => (
                  <button
                    key={p} type="button"
                    onClick={() => setValue('paymentMode', p)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                      paymentMode === p
                        ? 'bg-cyan-500 text-navy-950 border-cyan-500'
                        : 'border-surface-border dark:border-dark-border text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic UPI QR Code using Admin UPI ID and Payment Amount */}
            {paymentMode === 'upi' && (
              <div className="col-span-2 border border-surface-border dark:border-dark-border rounded-xl p-3 bg-surface-50 dark:bg-dark-100/50 text-center space-y-2">
                {!paymentAmount || Number(paymentAmount) <= 0 ? (
                  <p className="text-xs text-amber-500 dark:text-amber-400 font-semibold p-1 leading-normal">
                    Please enter a valid Fee amount first to generate the payment QR code.
                  </p>
                ) : admin?.upiId ? (
                  <>
                    <div className="mx-auto w-[130px] h-[130px] bg-white p-2 rounded-xl border border-slate-100 dark:border-dark-100 flex items-center justify-center shadow-inner">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          `upi://pay?pa=${admin.upiId}&pn=${encodeURIComponent("Qwasho Platform")}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`Sub-${(owner as any)?.tenantCode || 'New'}`)}`
                        )}`}
                        alt="UPI QR Code"
                        className="w-[110px] h-[110px] object-contain"
                      />
                    </div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-300">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Scan QR Code to collect Fee (₹{paymentAmount}) via UPI</p>
                      <p className="font-mono mt-0.5">{admin.upiId}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-amber-500 dark:text-amber-400 text-xs p-1 space-y-1 leading-normal">
                    <AlertTriangle className="mx-auto text-amber-500 animate-pulse" size={16} />
                    <p className="font-semibold">Admin UPI ID not configured</p>
                    <p className="text-[10px]">Configure your UPI ID in Profile settings to generate the payment QR code.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border dark:border-dark-border flex gap-3">
          <button onClick={onClose} className="qwasho-btn-ghost flex-1 justify-center">Cancel</button>
          <button
            onClick={handleSubmit(onSubmit as any)}
            disabled={isSubmitting}
            className="qwasho-btn-primary flex-1 justify-center disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Owner'}
          </button>
        </div>
      </div>
    </>
  );
}
