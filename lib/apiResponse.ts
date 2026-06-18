import { NextResponse } from 'next/server';

export function sendSuccess(status = 200, message = 'Success', data: unknown = null) {
  return NextResponse.json(
    { success: true, message, ...(data !== null && { data }) },
    { status }
  );
}

export function sendError(status = 500, message = 'Internal Server Error', errors: unknown[] = []) {
  console.error(`[API Error ${status}]:`, message, errors.length ? errors : '');
  return NextResponse.json(
    { success: false, message, errors },
    { status }
  );
}

export function sendPaginated(
  message = 'Fetched successfully',
  data: unknown[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
) {
  return NextResponse.json(
    { success: true, message, data, pagination },
    { status: 200 }
  );
}
