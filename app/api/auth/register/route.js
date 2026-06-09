import { z } from 'zod';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
// Assuming you keep services in src or move them to lib. For now, let's just 
// import the existing service since it doesn't rely on Express.
// But we need to use require since the rest of the app might still be CommonJS.
const { registerService } = require('../../../../src/modules/auth/auth.service');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email address'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate with Zod
    const validatedData = registerSchema.safeParse(body);
    if (!validatedData.success) {
      return sendError(400, 'Validation failed', validatedData.error.errors);
    }

    const result = await registerService(validatedData.data);
    return sendSuccess(201, 'Registration successful', result);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(status, error.message || 'Internal Server Error');
  }
}
