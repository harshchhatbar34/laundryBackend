import { z } from 'zod';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
const { loginService } = require('../../../../src/modules/auth/auth.service');

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate with Zod
    const validatedData = loginSchema.safeParse(body);
    if (!validatedData.success) {
      return sendError(400, 'Validation failed', validatedData.error.errors);
    }

    const { email, password } = validatedData.data;
    const result = await loginService(email, password);
    
    return sendSuccess(200, 'Login successful', result);
  } catch (error) {
    const status = error.statusCode || 401;
    return sendError(status, error.message || 'Invalid email or password');
  }
}
