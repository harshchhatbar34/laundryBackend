import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../user/user.model';
import Tenant from '../tenant/tenant.model';
import type { UserRole } from '@/types';

const generateToken = (userId: string, role: UserRole) => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as SignOptions['expiresIn'] };
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, options);
};

/**
 * Register a new customer.
 * Requires a tenantCode to bind the customer to a Laundry Owner.
 */
export const registerCustomer = async (body: {
  name: string;
  email: string;
  password: string;
  tenantCode: string;
}) => {
  const { name, email, password, tenantCode } = body;

  // Validate tenant code
  const tenant = await Tenant.findOne({ tenantCode: tenantCode.toUpperCase(), isActive: true });
  if (!tenant) {
    throw Object.assign(new Error('Invalid app code. Please use the correct app for your laundry service.'), { statusCode: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email is already in use.'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'customer',
    tenantId: tenant._id,
  });

  const token = generateToken(String(user._id), 'customer');
  return { token, user };
};

/**
 * Login for all roles (customer, helper, owner, superadmin).
 * Returns role in JWT so frontend can route appropriately.
 */
export const loginService = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account has been deactivated.'), { statusCode: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  const token = generateToken(String(user._id), user.role);
  return { token, user };
};
