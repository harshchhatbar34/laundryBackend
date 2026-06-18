# 📖 Laundry Backend API Documentation

This document serves as the comprehensive API reference for the Next.js/MongoDB laundry backend service. It details endpoints, authorization policies, parameters, request body schemas, and response formats.

---

## 🎨 Global Response Formats

All API responses follow a uniform JSON envelope structure:

### 1. Success Response
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

### 2. Paginated Success Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 3. Error Response
```json
{
  "success": false,
  "message": "Error details here",
  "errors": []
}
```

---

## 🔑 Authentication Module

### Login
Authenticates users of all roles (`customer`, `helper`, `owner`, `superadmin`).
- **Endpoint:** `POST /api/auth/login`
- **Auth Level:** Public
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | `string` | Yes | Registered email address |
  | `password` | `string` | Yes | Account password |

- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "60d000000000000000000001",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer",
        "isActive": true,
        "tenantId": "60d000000000000000000002"
      }
    }
  }
  ```

### Customer Registration
Registers a customer under a specific laundry owner using their `tenantCode`.
- **Endpoint:** `POST /api/auth/register`
- **Auth Level:** Public
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | `string` | Yes | Full Name |
  | `email` | `string` | Yes | Unique Email Address |
  | `password` | `string` | Yes | Account Password |
  | `tenantCode` | `string` | Yes | 8-character code of the white-label tenant |

- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "60d000000000000000000003",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer",
        "isActive": true,
        "tenantId": "60d000000000000000000002"
      }
    }
  }
  ```

---

## 📍 Branches Module

### Nearest Branch
Retrieves the nearest active branch for a coordinates pair.
- **Endpoint:** `GET /api/branches/nearest`
- **Auth Level:** Private (`customer`, `helper`, `owner`, `superadmin`)
- **Query Params:**
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `lat` | `number` | Yes | Latitude of user's current location |
  | `lng` | `number` | Yes | Longitude of user's current location |
  | `tenantCode` | `string` | No* | Tenant code. *Required only for non-customer roles* |

- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Nearest branch found",
    "data": {
      "branch": {
        "_id": "60d000000000000000000004",
        "tenant": "60d000000000000000000002",
        "name": "Central Laundry",
        "addressLine": "123 Main Street",
        "city": "Metropolis",
        "phone": "555-0100",
        "location": {
          "type": "Point",
          "coordinates": [-73.935242, 40.730610]
        },
        "isLive": true
      }
    }
  }
  ```

---

## 🧺 Masters & Public Services Catalog

### Masters Matrix
Retrieves items, materials, and pricing grids so the client can compile cart states offline.
- **Endpoint:** `GET /api/masters`
- **Auth Level:** Private (Any authenticated role)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Masters fetched",
    "data": {
      "materials": [
        { "_id": "60d0", "name": "Cotton", "isActive": true }
      ],
      "items": [
        { "_id": "60d1", "name": "Shirt", "isActive": true }
      ],
      "prices": [
        { "service": "60d2", "material": "60d0", "item": "60d1", "price": 40 }
      ]
    }
  }
  ```

### Active Services Catalog
Lists services available to browse (e.g. Dry Clean, Wash & Fold, Steam Press).
- **Endpoint:** `GET /api/services`
- **Auth Level:** Private (Any authenticated role)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Services fetched",
    "data": {
      "services": [
        {
          "_id": "60d2",
          "name": "Dry Clean",
          "description": "Premium dry cleaning for delicate wear",
          "icon": "🧥",
          "isActive": true,
          "sortOrder": 0
        }
      ]
    }
  }
  ```

---

## 🛍️ Customer Orders Module

### Get My Orders
- **Endpoint:** `GET /api/orders`
- **Auth Level:** Private (`customer`)
- **Query Params:**
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `10`)
  - `status` (optional, e.g. `picked_up`, `ready`)

### Place Order
- **Endpoint:** `POST /api/orders`
- **Auth Level:** Private (`customer`)
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `branchId` | `string` | Yes | Target Branch Object ID |
  | `addressId` | `string` | Yes | Customer Address Object ID |
  | `scheduledPickup` | `object` | Yes | `{ "date": "YYYY-MM-DD", "slot": "Morning (9am-12pm)" }` |
  | `items` | `array` | Yes | Array of: `{ material, item, service, quantity }` |
  | `couponCode` | `string` | No | Promotional coupon code |
  | `paymentMethod` | `string` | No | `'cash'` or `'upi'` (Default: `'cash'`) |
  | `notes` | `string` | No | Additional pickup directions/notes |

- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Order placed successfully",
    "data": {
      "order": {
        "_id": "60d000000000000000000100",
        "orderNumber": "ORD-17187123",
        "status": "pending",
        "pricing": {
          "subtotal": 150.00,
          "discount": 0.00,
          "total": 150.00
        }
      }
    }
  }
  ```

### Order Details
- **Endpoint:** `GET /api/orders/[id]`
- **Auth Level:** Private (Assigned Customer, Helper, or Owner)

### Cancel Order
- **Endpoint:** `PATCH /api/orders/[id]`
- **Auth Level:** Private (`customer`)
- **Request Body:**
  ```json
  { "action": "cancel" }
  ```

### Reschedule Delivery
Used by customers to book a new slot if the helper marked the previous delivery attempt as failed (`failed_delivery`).
- **Endpoint:** `POST /api/orders/[id]/reschedule`
- **Auth Level:** Private (`customer`)
- **Request Body:**
  ```json
  { "newDeliveryDate": "2026-06-25T15:30:00.000Z" }
  ```

---

## 🛵 Helper Module

### Get Assigned Orders
- **Endpoint:** `GET /api/helper/orders`
- **Auth Level:** Private (`helper`)
- **Query Params:** `page`, `limit`, `status`

### Get Order Detail
- **Endpoint:** `GET /api/helper/orders/[id]`
- **Auth Level:** Private (`helper`)

### Accept, Update Status, or Mark Failed Delivery
- **Endpoint:** `PATCH /api/helper/orders/[id]`
- **Auth Level:** Private (`helper`)
- **Request Body:**
  - **Accept order:** `{ "action": "accept" }`
  - **Mark failed delivery:** `{ "action": "fail_delivery" }`
  - **Update status:**
    ```json
    {
      "action": "status",
      "status": "picked_up", // see OrderStatus list in backend types
      "note": "Optional comment for history timeline"
    }
    ```

### Update Order Items & Recalculate Bill (At Pickup)
> [!IMPORTANT]
> The helper uses this to enter the verified items/weight during pickup. This recalculates the pricing matrix, updates the bill status, and triggers a customer notification.
- **Endpoint:** `PATCH /api/helper/bill/[id]`
- **Auth Level:** Private (`helper`)
- **Request Body:**
  ```json
  {
    "items": [
      {
        "material": "60d000000000000000000005",
        "item": "60d000000000000000000006",
        "service": "60d000000000000000000008",
        "quantity": 8
      }
    ]
  }
  ```

---

## 🏢 Owner Management Module

### Manage Branches
- **List Branches:** `GET /api/owner/branches`
- **Create Branch:** `POST /api/owner/branches`
  - Body: `{ name, addressLine, city, phone, location: { type: "Point", coordinates: [lng, lat] } }`
- **Update Branch:** `PATCH /api/owner/branches/[id]`
- **Toggle Live Status:** `PATCH /api/owner/branches/[id]/status`
  - Body: `{ "isLive": false }`

### Manage Helpers
- **List Helpers:** `GET /api/owner/helpers`
- **Create Helper:** `POST /api/owner/helpers`
  - Body: `{ "name": "Helper Name", "email": "helper@shop.com", "password": "pass" }`
- **Toggle Helper State:** `PATCH /api/owner/helpers`
  - Body: `{ "helperId": "xxx", "isActive": true }`

### Respond to Orders
Allows owner to accept/reject incoming customer bookings.
- **Endpoint:** `PATCH /api/owner/orders/[id]`
- **Request Body:** `{ "action": "accept" }` or `{ "action": "reject", "note": "Out of delivery area" }`

### Service & Catalog Management
- **List Catalog & Pricing Matrix:** `GET /api/owner/services`
- **Create Element (Service/Material/Item/Price):** `POST /api/owner/services`
  - Body: `{ "type": "service"|"material"|"item"|"price", "data": { ... } }`
- **Update Service:** `PATCH /api/owner/services`
  - Body: `{ "id": "serviceId", "data": { ... } }`
- **Delete Service / Price Matrix:** `DELETE /api/owner/services`
  - Query Params: `?id=xxx&type=service` or `?id=xxx&type=price`

### View Stats
- **Endpoint:** `GET /api/owner/stats`
- **Query Params:** `?branchId=xxx`

---

## ⭐ Reviews Module

### Submit Review & Rating
- **Endpoint:** `POST /api/ratings`
- **Auth Level:** Private (`customer`)
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `orderId` | `string` | Yes | Associated Order Object ID |
  | `rating` | `number` | Yes | Range: `1` to `5` |
  | `review` | `string` | No | Customer feedback comments |

---

## 🔔 Notifications

- **List Notifications:** `GET /api/notifications` (supports `page`, `limit`)
- **Mark All as Read:** `PATCH /api/notifications`

---

## ⚙️ Superadmin Module

- **List/Create/Deactivate Owners:** `GET|POST|PATCH /api/superadmin/owners`
- **Generate Tenant Code:** `POST /api/superadmin/tenants`
  - Body: `{ "ownerId": "ownerId" }`
- **Coupon Admin CRUD:** `GET|POST|PATCH|DELETE /api/superadmin/coupons`
- **Global Platform Stats:** `GET /api/superadmin/stats`

---

## 👤 User & Address Profile

- **Fetch Profile:** `GET /api/users/profile`
- **Update Profile Name:** `PATCH /api/users/profile`
  - Body: `{ "name": "New Name" }`
- **Fetch Addresses:** `GET /api/users/addresses`
- **Add Address:** `POST /api/users/addresses`
  - Body: `{ label, addressLine1, addressLine2, city, state, pincode, location: { type: "Point", coordinates: [lng, lat] } }`
- **Delete Address:** `DELETE /api/users/addresses/[id]`
