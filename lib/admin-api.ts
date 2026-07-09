import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Backend response shapes:
 *  sendSuccess(200, msg, payload)  → { success, message, data: payload }
 *  Owners:    data → { owners:[],   total, page, limit, totalPages }
 *  Customers: data → { customers:[], total, page, limit, totalPages }
 *  Orders:    data → { orders:[],   total, page, limit, totalPages }
 *  Tenants:   data → { tenants:[],  total, page, limit, totalPages }
 *  Coupons:   data → { coupons:[]  }  (no pagination)
 *  Stats:     data → { stats: { totalOwners, totalCustomers, totalOrders, totalRevenue } }
 */

type PaginatedResult = {
  data: unknown[];
  pagination: { total: number; page: number; limit: number; pages: number };
};

function normalizePaginated(axiosData: any, arrayKey: string): PaginatedResult {
  const payload = axiosData.data ?? {};
  // sendPaginated shape → { data: [], pagination: {} }
  if (Array.isArray(payload)) {
    return { data: payload, pagination: { total: 0, page: 1, limit: 20, pages: 1 } };
  }
  const arr = payload[arrayKey] ?? [];
  return {
    data: arr,
    pagination: {
      total: payload.total ?? 0,
      page: payload.page ?? 1,
      limit: payload.limit ?? 20,
      pages: payload.totalPages ?? (Math.ceil((payload.total ?? 0) / (payload.limit ?? 20)) || 1),
    },
  };
}

export const api = {
  // Stats
  getStats: () =>
    adminApi.get('/api/superadmin/stats').then(r => r.data?.data?.stats ?? r.data?.data ?? {}),

  // Order trend chart — returns [{ day, orders, revenue }]
  getOrderTrend: (days = 7) =>
    adminApi.get(`/api/superadmin/stats/trend?days=${days}`).then(r => r.data?.data?.trend ?? []),

  // Owners
  getOwners: (params?: Record<string, unknown>) =>
    adminApi.get('/api/superadmin/owners', { params }).then(r => normalizePaginated(r.data, 'owners')),
  getOwner: (id: string) =>
    adminApi.get(`/api/superadmin/owners/${id}`).then(r => r.data.data),
  createOwner: (data: unknown) =>
    adminApi.post('/api/superadmin/owners', data).then(r => r.data),
  updateOwner: (id: string, data: unknown) =>
    adminApi.patch(`/api/superadmin/owners/${id}`, data).then(r => r.data),
  // Toggle uses PATCH /api/superadmin/owners with body { ownerId, isActive }
  toggleOwner: (id: string, isActive: boolean) =>
    adminApi.patch('/api/superadmin/owners', { ownerId: id, isActive }).then(r => r.data),

  // Customers
  getCustomers: (params?: Record<string, unknown>) =>
    adminApi.get('/api/superadmin/customers', { params }).then(r => normalizePaginated(r.data, 'customers')),
  getCustomer: (id: string) =>
    adminApi.get(`/api/superadmin/customers/${id}`).then(r => r.data?.data?.customer ?? r.data?.data),

  // Orders
  getOrders: (params?: Record<string, unknown>) =>
    adminApi.get('/api/superadmin/orders', { params }).then(r => normalizePaginated(r.data, 'orders')),

  // Coupons (no pagination - returns flat array)
  getCoupons: () =>
    adminApi.get('/api/superadmin/coupons').then(r => ({
      data: (r.data?.data?.coupons ?? r.data?.data ?? []),
    })),
  // POST body needs: { code, type, value, minOrderAmount?, maxUsage?, expiresAt? }
  createCoupon: (data: unknown) =>
    adminApi.post('/api/superadmin/coupons', data).then(r => r.data),
  // PATCH body: { id, data }
  updateCoupon: (id: string, data: unknown) =>
    adminApi.patch('/api/superadmin/coupons', { id, data }).then(r => r.data),
  // DELETE uses query param: ?id=
  deleteCoupon: (id: string) =>
    adminApi.delete(`/api/superadmin/coupons?id=${id}`).then(r => r.data),

  // Tenants
  getTenants: (params?: Record<string, unknown>) =>
    adminApi.get('/api/superadmin/tenants', { params }).then(r => normalizePaginated(r.data, 'tenants')),
};
