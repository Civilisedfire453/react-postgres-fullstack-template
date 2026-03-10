# Admin Logic Overview

## Authentication

- **Admin login**: `POST /api/auth/login` with `email` and `password`
- **JWT**: On success, the API returns a `token` (JWT) valid for 7 days
- **Auth header**: Admin endpoints require `Authorization: Bearer <token>`
- **Role check**: `requireAdmin` middleware ensures `user.role === "admin"`
- **Storage**: The frontend stores `{ user, token }` in `localStorage` under key `"auth"`

## Admin Routes (all require admin JWT)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/products` | POST | Create product + variants |
| `/api/admin/products/:id` | PUT | Update product fields |
| `/api/admin/variants/:id/adjust-inventory` | POST | Add/remove stock (delta, reason) |
| `/api/admin/inventory` | GET | List variants (optional `?low_stock=true`) |
| `/api/admin/orders` | GET | List all orders |

## Flow

1. **Login** → Admin enters email/password → JWT issued
2. **Products** → View list of products (from `/api/products`)
3. **Inventory** → View all/low-stock variants, click "Adjust" to change stock
4. **Orders** → View order list with status, payment, total

## Default Admin

- Email: `admin@example.com`
- Password: `admin123` (set in `init.sql`; change in production)
