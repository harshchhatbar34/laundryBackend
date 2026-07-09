'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, adminApi } from './admin-api';
import { toast } from 'sonner';

// ── Admin Profile ─────────────────────────────────────────────
export const useAdminProfile = () =>
  useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => adminApi.get('/api/admin-auth/me').then((r: any) => r.data?.data?.user ?? null),
    staleTime: 5 * 60_000,
  });

// ── Stats ─────────────────────────────────────────────────────
export const usePlatformStats = () =>
  useQuery({ queryKey: ['platform-stats'], queryFn: api.getStats, staleTime: 60_000 });

export const useOrderTrend = (days = 7) =>
  useQuery({
    queryKey: ['order-trend', days],
    queryFn: () => api.getOrderTrend(days),
    staleTime: 60_000,
  });

// ── Owners ────────────────────────────────────────────────────
export const useOwners = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['owners', params], queryFn: () => api.getOwners(params) });

export const useOwner = (id: string) =>
  useQuery({ queryKey: ['owner', id], queryFn: () => api.getOwner(id), enabled: !!id });

export const useCreateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createOwner,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owners'] }); toast.success('Owner created'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create owner'),
  });
};

export const useUpdateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.updateOwner(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['owners'] });
      qc.invalidateQueries({ queryKey: ['owner', id] });
      toast.success('Owner updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update owner'),
  });
};

export const useToggleOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.toggleOwner(id, isActive),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ['owners'] });
      toast.success(isActive ? 'Owner activated' : 'Owner blocked');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update owner status'),
  });
};

// ── Customers ─────────────────────────────────────────────────
export const useCustomers = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['customers', params], queryFn: () => api.getCustomers(params) });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: ['customer', id], queryFn: () => api.getCustomer(id), enabled: !!id });

// ── Orders ───────────────────────────────────────────────────
export const useOrders = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['orders', params], queryFn: () => api.getOrders(params) });

// ── Coupons ──────────────────────────────────────────────────
export const useCoupons = () =>
  useQuery({ queryKey: ['coupons'], queryFn: api.getCoupons });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCoupon,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Coupon created'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create coupon'),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => api.updateCoupon(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Coupon updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to update coupon'),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCoupon,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Coupon deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to delete coupon'),
  });
};

// ── Tenants ──────────────────────────────────────────────────
export const useTenants = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['tenants', params], queryFn: () => api.getTenants(params) });
