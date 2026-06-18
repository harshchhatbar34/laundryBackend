import { NextResponse } from 'next/server';
import { logger } from './logger';

export function sendSuccess(status = 200, message = 'Success', data: unknown = null) {
  logger.info(`[API Success ${status}]: ${message}`);
  return NextResponse.json(
    { success: true, message, ...(data !== null && { data }) },
    { status }
  );
}

export function sendError(status = 500, message = 'Internal Server Error', errors: unknown[] = []) {
  logger.error(`[API Error ${status}]: ${message}`, null, { errors });
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
  logger.info(`[API Success 200]: ${message} (Page ${pagination.page}/${pagination.totalPages}, Total ${pagination.total})`);
  return NextResponse.json(
    { success: true, message, data, pagination },
    { status: 200 }
  );
}
