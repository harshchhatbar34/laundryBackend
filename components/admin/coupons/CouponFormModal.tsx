'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useCreateCoupon, useUpdateCoupon } from '@/lib/admin-queries';
import { cn } from '@/lib/utils';

// Field names match the actual coupon model:
// code, type ('percentage'|'flat'), value, minOrderAmount, maxUsage, expiresAt
const schema = z.object({
  code:           z.string().min(3),
  type:           z.enum(['percentage', 'flat']),
  value:          z.number().min(1),
  minOrderAmount: z.number().optional(),
  maxUsage:       z.number().optional(),
  expiresAt:      z.string().optional(),
});
type CouponForm = z.infer<typeof schema>;

interface CouponFormModalProps {
  open: boolean;
  onClose: () => void;
  coupon?: any | null;
}

export function CouponFormModal({ open, onClose, coupon }: CouponFormModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const isEdit = !!coupon?._id;
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<CouponForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: 'percentage' },
  });
  const type = watch('type');

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
      if (coupon) {
        reset({
          code: coupon.code,
          type: coupon.type ?? 'percentage',
          value: coupon.value,
          minOrderAmount: coupon.minOrderAmount,
          maxUsage: coupon.maxUsage,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
        });
      } else {
        reset({ type: 'percentage' });
      }
    } else {
      ref.current?.close();
    }
  }, [open, coupon, reset]);

  const onSubmit = async (data: CouponForm) => {
    const payload = {
      ...data,
      code: data.code.toUpperCase(),
      expiresAt: data.expiresAt || undefined,
    };
    if (isEdit && coupon?._id) {
      await updateCoupon.mutateAsync({ id: coupon._id, data: payload });
    } else {
      await createCoupon.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-50
                 shadow-2xl p-0 max-w-md w-full backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-dark-border">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Coupon' : 'New Coupon'}
            </h3>
            <button onClick={onClose} className="qwasho-btn-ghost p-2"><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit as any)} className="px-6 py-5 space-y-4">
            <div>
              <label className="qwasho-label">Coupon Code</label>
              <input {...register('code')} className="qwasho-input uppercase" placeholder="SAVE20" />
              {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="qwasho-label">Discount Type</label>
              <div className="flex gap-2">
                {(['percentage', 'flat'] as const).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setValue('type', t)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                      type === t
                        ? 'bg-cyan-500 text-navy-950 border-cyan-500'
                        : 'border-surface-border dark:border-dark-border text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {t === 'percentage' ? '% Percentage' : '₹ Flat Amount'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="qwasho-label">
                  {type === 'percentage' ? 'Discount %' : 'Flat Amount ₹'}
                </label>
                <input {...register('value', { valueAsNumber: true })} type="number" className="qwasho-input" placeholder={type === 'percentage' ? '20' : '100'} />
                {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value.message}</p>}
              </div>
              <div>
                <label className="qwasho-label">Min Order (₹)</label>
                <input {...register('minOrderAmount', { valueAsNumber: true })} type="number" className="qwasho-input" placeholder="0" />
              </div>
              <div>
                <label className="qwasho-label">Max Usage</label>
                <input {...register('maxUsage', { valueAsNumber: true })} type="number" className="qwasho-input" placeholder="Unlimited" />
              </div>
              <div>
                <label className="qwasho-label">Expires On</label>
                <input {...register('expiresAt')} type="date" className="qwasho-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="qwasho-btn-ghost flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="qwasho-btn-primary flex-1 justify-center disabled:opacity-60">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </>
      )}
    </dialog>
  );
}
