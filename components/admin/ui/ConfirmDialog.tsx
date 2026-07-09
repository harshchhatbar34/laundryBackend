'use client';

import { useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm, onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-50
                 shadow-2xl p-6 max-w-sm w-full backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex gap-3 items-start mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          variant === 'danger' ? 'bg-red-100 dark:bg-red-500/15' : 'bg-yellow-100 dark:bg-yellow-500/15'
        }`}>
          <AlertTriangle size={17} className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-900 dark:text-white text-base">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="qwasho-btn-ghost">{cancelLabel}</button>
        <button
          onClick={onConfirm}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
            variant === 'danger'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
