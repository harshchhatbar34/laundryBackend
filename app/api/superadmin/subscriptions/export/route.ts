import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import type { AuthContext } from '@/types';
import { listSubscriptions } from '@/src/modules/subscription/subscription.service';
import * as XLSX from 'xlsx';

// GET /api/superadmin/subscriptions/export?format=csv|excel&month=&year=&status=&type=
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const format = url.searchParams.get('format') ?? 'csv'; // csv | excel

    const { records } = await listSubscriptions({
      month:  url.searchParams.get('month')  ? Number(url.searchParams.get('month'))  : undefined,
      year:   url.searchParams.get('year')   ? Number(url.searchParams.get('year'))   : undefined,
      status: url.searchParams.get('status') ?? undefined,
      type:   url.searchParams.get('type')   ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      limit:  10000,
    });

    const rows = records.map((r: any) => ({
      'Owner Name':        r.ownerName,
      'Laundry Name':      r.laundryName,
      'Tenant Code':       r.tenantCode,
      'Subscription Type': r.subscriptionType.charAt(0).toUpperCase() + r.subscriptionType.slice(1),
      'Amount (₹)':        r.amount,
      'Start Date':        new Date(r.startDate).toLocaleDateString('en-IN'),
      'Due Date':          new Date(r.dueDate).toLocaleDateString('en-IN'),
      'Status':            r.status.charAt(0).toUpperCase() + r.status.slice(1),
      'Notes':             r.notes ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'excel') {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="subscriptions-${timestamp}.xlsx"`,
        },
      });
    }

    // CSV
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscriptions-${timestamp}.csv"`,
      },
    });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});
