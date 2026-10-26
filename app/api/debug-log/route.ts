import { NextRequest } from 'next/server';
import { sendSuccess } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'client-debug.log');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = `[${new Date().toISOString()}] ${JSON.stringify(body)}\n`;
    console.log('[CLIENT_LOG]', JSON.stringify(body));
    fs.appendFileSync(logFile, entry);
    return sendSuccess(200, 'logged', { ok: true });
  } catch (err: any) {
    return sendSuccess(200, 'error logging', { error: err.message });
  }
}

export async function GET() {
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('No logs yet', { headers: { 'Content-Type': 'text/plain' } });
}
