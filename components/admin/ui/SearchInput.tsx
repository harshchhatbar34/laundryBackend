'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search…',
  value: externalValue,
  onChange,
  debounceMs = 400,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (externalValue !== undefined) setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (val: string) => {
    setLocalValue(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounceMs);
  };

  return (
    <div className={cn('relative flex-1 max-w-xs', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        className="qwasho-input pl-9 pr-8"
      />
      {localValue && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
