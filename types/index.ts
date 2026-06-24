// ─── Shared TypeScript Interfaces & Enums ──────────────────────────────────
import { Document, Types } from 'mongoose';

// ─── Roles ──────────────────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'owner' | 'helper' | 'customer';

// ─── Order Status ────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'         // placed, awaiting acceptance
  | 'accepted'        // accepted by owner or helper
  | 'rejected'        // rejected by owner
  | 'pickup'          // helper on the way for pickup
  | 'picked_up'       // clothes collected, bill updated
  | 'processing'      // washing/ironing
  | 'ready'           // ready for delivery
  | 'out_for_delivery'// helper leaving for delivery
  | 'failed_delivery' // customer unavailable — awaiting reschedule
  | 'delivered'       // delivered, payment collected
  | 'completed'       // payment collected, order finished
  | 'cancelled';      // cancelled by customer

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'rejected',
  'pickup',
  'picked_up',
  'processing',
  'ready',
  'out_for_delivery',
  'failed_delivery',
  'delivered',
  'completed',
  'cancelled',
];

// ─── Payment ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'upi';
export type PaymentStatus = 'pending' | 'paid';

// ─── Subscription ────────────────────────────────────────────────────────────
export type SubscriptionType = 'monthly' | 'yearly' | 'onetime';

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  mobileNumber?: string;
  photo?: string;            // URL or file path
  password: string;
  role: UserRole;
  tenantId: Types.ObjectId | null; // set for customers — links to their Tenant
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Address ─────────────────────────────────────────────────────────────────
export interface IAddress extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  label: string;           // e.g. "Home", "Office"
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isDefault: boolean;
}

// ─── Tenant ──────────────────────────────────────────────────────────────────
export interface ITenant extends Document {
  _id: Types.ObjectId;
  tenantCode: string;        // hardcoded in each white-label app
  owner: Types.ObjectId;     // ref User (role: owner)
  laundryName: string;       // business/brand name
  address?: string;          // laundry business address
  landmark?: string;         // optional landmark / line 2
  city?: string;
  state?: string;
  pincode?: string;
  paymentAmount: number;     // subscription fee amount
  paymentMode: PaymentMethod;// cash or upi
  subscription: SubscriptionType; // monthly, yearly, onetime
  upiId?: string;            // owner's UPI ID for receiving customer payments
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Branch ──────────────────────────────────────────────────────────────────
export interface IBranch extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;  // ref Tenant
  owner: Types.ObjectId;   // ref User (role: owner) — denormalized for fast queries
  name: string;
  addressLine: string;
  landmark?: string;
  city: string;
  phone: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isLive: boolean;         // LIVE or CLOSED toggle
  createdAt: Date;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export interface IService extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;  // ref Tenant
  name: string;            // e.g. "Wash", "Dry Clean", "Iron"
  description: string;
  icon: string;            // emoji or icon key
  price: number;
  isActive: boolean;
  sortOrder: number;
}

// ─── Material ────────────────────────────────────────────────────────────────
export interface IMaterial extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;            // e.g. "Cotton", "Silk", "Wool"
  price: number;
  isActive: boolean;
}

// ─── Item ────────────────────────────────────────────────────────────────────
export interface IItem extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;            // e.g. "Shirt", "Trouser", "Saree"
  price: number;
  isActive: boolean;
}

// ─── Coupon ──────────────────────────────────────────────────────────────────
export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: Date | null;
}

// ─── Order Item ───────────────────────────────────────────────────────────────
export interface IOrderItem {
  material: Types.ObjectId;
  item: Types.ObjectId;
  service: Types.ObjectId;
  quantity: number;
  price: number;           // price per unit at time of order
}

// ─── Order Timeline Entry ─────────────────────────────────────────────────────
export interface ITimelineEntry {
  status: OrderStatus;
  note: string;
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  tenant: Types.ObjectId;
  branch: Types.ObjectId;
  customer: Types.ObjectId;
  helper: Types.ObjectId | null;
  items: IOrderItem[];
  address: Types.ObjectId;
  scheduledPickup: {
    date: Date;
    slot: string;
  };
  scheduledDelivery: Date | null;   // set after pickup; updated on reschedule
  status: OrderStatus;
  timeline: ITimelineEntry[];
  coupon: Types.ObjectId | null;
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
  };
  billUpdated: boolean;             // true after helper updates bill at pickup
  billConfirmed: boolean;           // true after customer confirms updated bill
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Rating ──────────────────────────────────────────────────────────────────
export interface IRating extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  customer: Types.ObjectId;
  branch: Types.ObjectId;
  rating: number;          // 1–5
  review: string;
  createdAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  body: string;
  type: 'order' | 'system' | 'payment';
  refId: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  role: UserRole;
}

// ─── Auth Context (injected by withAuth) ─────────────────────────────────────
export interface AuthContext<P extends Record<string, string> = Record<string, string>> {
  params: P;
  user: {
    _id: Types.ObjectId;
    role: UserRole;
  };
}
