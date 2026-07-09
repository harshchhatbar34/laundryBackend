'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useCreateOwner, useUpdateOwner } from '@/lib/admin-queries';
import { cn } from '@/lib/utils';

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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<OwnerForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: { subscription: 'monthly', paymentMode: 'cash' },
  });

  const subscription = watch('subscription');
  const paymentMode  = watch('paymentMode');

  useEffect(() => {
    if (owner && open) {
      reset({ ...owner, password: '' });
    } else if (!owner && open) {
      reset({ subscription: 'monthly', paymentMode: 'cash' });
    }
  }, [owner, open, reset]);

  const onSubmit = async (data: OwnerForm) => {
    const payload = { ...data };
    if (isEdit && !payload.password) delete payload.password;

    if (isEdit && owner?._id) {
      await updateOwner.mutateAsync({ id: owner._id, data: payload });
    } else {
      await createOwner.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />}

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
          <button onClick={onClose} className="qwasho-btn-ghost p-2"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
            <div className="col-span-2">
              <label className="qwasho-label">Password {isEdit && <span className="normal-case font-normal text-slate-400">(leave blank to keep)</span>}</label>
              <input {...register('password')} type="password" className="qwasho-input" placeholder="••••••••" />
            </div>
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
              <input {...register('paymentAmount')} type="number" className="qwasho-input" placeholder="999" />
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
            {paymentMode === 'upi' && (
              <div className="col-span-2">
                <label className="qwasho-label">UPI ID</label>
                <input {...register('upiId')} className="qwasho-input" placeholder="raj@upi" />
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
