## Future Implementation: Email Receipts

This document tracks planned work for adding **email receipts** after a customer places an order.

Neon is already used as the database for orders and customers. Email delivery itself must be handled by an email-capable service or SMTP server – the ideas below assume we keep Neon as the source of truth and add an email layer on top.

---

### Option A – Python script using SMTP (send from a given email address)

**Goal:** Be able to send receipts “from” a specific email address (e.g. a Gmail or Microsoft 365 mailbox) by running a small Python script. Neon is used to read order + customer data; SMTP is used to actually send the email.

- **Inputs:**
  - SMTP host, port, username, password/app-password (e.g. Gmail, Outlook, or a custom SMTP server)
  - From address (usually the same as the SMTP user)
  - Order ID (the script will look up the order and its items in Neon)

- **High-level flow:**
  1. Python script connects to Neon using the Postgres connection string.
  2. Script queries:
     - `orders` for customer name, email, totals, etc.
     - `order_items` joined with `products` / `product_variants` for line items.
  3. Script formats a plain-text and/or HTML receipt body.
  4. Script connects to SMTP (e.g. `smtp.gmail.com:587`) using TLS and logs in.
  5. Script sends an email:
     - From: configured sender address
     - To: `customer_email` from the order
     - Subject: “Your order receipt – {store name}”
  6. Script optionally writes back to Neon:
     - `receipt_sent_at`
     - `receipt_status` (e.g. `sent`, `failed`)
     - `receipt_error` (if sending failed)

- **Usage modes:**
  - **Manual**: run the script from a terminal, passing an order ID (e.g. `python send_receipt.py --order-id 123`).
  - **Batch**: run periodically (e.g. cron or GitHub Actions) to send receipts for any orders that don’t have `receipt_sent_at` set.

This option is flexible and works with almost any mailbox as long as SMTP credentials are available.

---

### Option B – Email API provider (Resend / SendGrid / Mailgun / SES)

**Goal:** Use a dedicated transactional email provider to send receipts, still using Neon for order data, but offloading delivery, reputation, and templates to an email API.

- **Inputs:**
  - API key for the email provider (stored as a secret)
  - Verified sending domain/sender (e.g. `no-reply@myfilters.store`)
  - Order ID (or the order object during checkout in the Worker)

- **High-level flow:**
  1. Cloudflare Worker (in `/api/checkout/complete`) or a separate script:
     - Reads the order + items from Neon (same as Option A).
  2. Builds an email payload:
     - To: `customer_email`
     - From: verified sender in the email provider
     - Subject: “Your order receipt – {store name}”
     - Body: HTML + plain text summary of order, shipping details, totals.
  3. Calls the provider’s HTTP API (e.g. Resend/SendGrid/Mailgun/SES) to send the email.
  4. Writes back to Neon:
     - `receipt_sent_at`
     - `receipt_status`
     - `receipt_provider_id` (e.g. message ID from the API)

- **Usage modes:**
  - **Automatic on checkout**: The Worker calls the email API immediately after a successful payment / demo completion and order creation.
  - **Retry / re-send**: Admin panel could expose a “Resend receipt” button that triggers the same API call for the selected order.

This option is better for production: more reliable delivery, easier templating, and less risk of being flagged as spam than sending directly from a personal mailbox.

---

### Next Steps

1. Decide which option to implement first:
   - **Option A** for a quick, local-friendly, SMTP-based script.
   - **Option B** for a more production-ready, scalable email pipeline.
2. Add minimal schema fields to `orders` in Neon if needed (e.g. `receipt_sent_at`, `receipt_status`, `receipt_provider_id`, `receipt_error`).
3. Implement the sending logic and wire it into:
   - The checkout completion path in the Cloudflare Worker, and/or
   - A standalone Python utility script for manual/batch sending.

