# Water Filter Store – React + PostgreSQL + Hyperdrive on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-postgres-fullstack-template)

![Build a water filter e-commerce app using Cloudflare Workers Assets, Hono, and Hyperdrive](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/cd71c67a-253f-477d-022c-2f90cb4b3d00/public)

<!-- dash-content-start -->

Build a water filter e‑commerce site using [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/), Hono API routes, and [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) to connect to a PostgreSQL database. [Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/) is enabled to automatically position your Worker closer to your database for reduced latency.

Browse a catalog of water filters with variants (capacities, pack sizes) and real inventory tracking backed by PostgreSQL. Customers can view products, see stock levels, add items to a cart, and check out via Fat Zebra payments. Admin users can log in to manage products, low‑stock inventory, and orders from an admin dashboard.

## Features

- 📖 Dynamic routes
- 📦 Asset bundling and optimization
- 🌐 Optimized Worker placement
- 🚀 Database connection via Hyperdrive
- 🎉 TailwindCSS for styling
- 🐳 Docker for container management

## Smart Placement Benefits

This application uses Cloudflare Workers' [Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/) feature to optimize performance.

- **What is Smart Placement?** Smart Placement [can dynamically position](https://developers.cloudflare.com/workers/configuration/smart-placement/#understand-how-smart-placement-works) your Worker in Cloudflare's network to minimize latency between your Worker and database.

- **How does it work?** The application makes multiple database round trips per request. Smart Placement analyzes this traffic pattern and can choose to position the Worker and Hyperdrive closer to your deployed database to reduce latency. This can significantly improve response times, especially for read-intensive operations requiring multiple database queries in the product catalog and checkout flows.

- **No configuration needed:** Smart Placement works automatically when enabled in `wrangler.jsonc` with `"mode": "smart"`.

<!-- dash-content-end -->

## Tech Stack

- **Frontend**: React + React Router for client-side navigation [using declarative routing](https://reactrouter.com/en/main/start/overview)
  - Built with Vite and deployed as static assets via Workers
  - React SPA mode enabled in `wrangler.jsonc` for client-side navigation

- **Backend**: API routes served by a Worker using [Hono](https://hono.dev/)
  - Catalog: `/api/products`
  - Cart & checkout: `/api/cart`, `/api/checkout/*`
  - Orders: `/api/orders`
  - Auth: `/api/auth/*` (JWT-based)
  - Admin: `/api/admin/*` (role-based access)

- **Database**: PostgreSQL database connected via Cloudflare Hyperdrive
  - Smart Placement enabled for optimal performance
  - Handles missing connection strings or connection failures

- **Payments**: Fat Zebra REST API (sandbox or live, configured as Worker secrets)

## Get Started

To run the applicaton locally, use the Docker container defined in `docker-compose.yml`:

1. `docker-compose up -d`
   - Creates container with PostgreSQL and seeds it with the data found in `init.sql`
2. `npm run dev`

If you update `init.sql`, be sure to run `docker-compose down -v` to teardown the previous image.

### Setting Up Hyperdrive Bindings

Cloudflare's Hyperdrive is database connector that optimizes queries from your Workers to various database providers using a connection string. Here's a detailed explanation of how to set it up:

1. **Create a Hyperdrive configuration**:

   ```sh
   npx wrangler hyperdrive create my-hyperdrive-config --connection-string="postgres://user:password@hostname:port/dbname"
   ```

   This command will return the Hyperdrive ID that you'll need for your configuration.

2. **Configure Hyperdrive in wrangler.jsonc**:

   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",  // Name used to access the binding in your code
       "id": "YOUR_HYPERDRIVE_ID",  // ID from the create command
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"  // Local dev connection
     }
   ]
   ```

3. **Access in your code**:

   ```javascript
   // Example from this project
   if (c.env.HYPERDRIVE) {
   	const sql = postgres(c.env.HYPERDRIVE.connectionString);
   	// Use SQL client
   }
   ```

4. **Fallback handling**: This application automatically falls back to mock data if:
   - Hyperdrive binding is not configured
   - Database connection fails for any reason

For a more detailed walkthrough, see the [Hyperdrive documentation](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-postgres/).

### More on Docker's Use in Local Development

When developing locally with Hyperdrive, you **must** use the Docker setup provided. This is because Hyperdrive's local dev mode requires a database running on localhost with the exact configuration specified in `localConnectionString`.

The Docker setup in this template ensures the PostgreSQL instance is properly configured to work with Hyperdrive locally. The container automatically runs `init.sql` to create tables and load sample data.

While remote database use in local dev with Hyperdrive is not currently supported, it is being worked on.

## Ways to Deploy

There are two different ways to deploy this application: Full Experience and Demo Mode.

### Option 1: With Database (Full Experience)

1. Run `npm i`
2. Sign up for a PostgreSQL provider and create a database
   - Quickstart options: [Supabase](https://supabase.com/), [Neon](https://neon.tech/)
3. Load the sample data using the provided SQL script:
   - The `/init.sql` file contains all database schema and sample data
   - You can either:
     - Copy and paste the contents into your database provider's SQL editor
     - Or use a command line tool like `psql`: `psql -h hostname -U username -d dbname -f init.sql`
4. Create a Hyperdrive connection by running:
   ```sh
   npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="<postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name>"
   ```
5. Uncomment and update the Hyperdrive binding in `wrangler.jsonc` with the ID from step 4:
   ```json
   "hyperdrive": [
     {
       "binding": "HYPERDRIVE",
       "id": "YOUR_HYPERDRIVE_ID",
       "localConnectionString": "postgresql://myuser:mypassword@localhost:5432/mydatabase"
     }
   ]
   ```
6. Deploy with `npm run deploy`

### Required environment variables / secrets

In addition to the Hyperdrive binding, configure these in your Cloudflare Worker environment (Dashboard → Workers & Pages → your project → Settings → Variables and Secrets):

- `JWT_SECRET` (Secret): Secret key used to sign and verify JWTs for `/api/auth/*`.
- `FATZEBRA_USERNAME` (Secret): Fat Zebra API username (used for checkout; also exposed to frontend for SDK init).
- `FATZEBRA_TOKEN` (Secret): Fat Zebra API token.

### Admin & checkout

- **Admin logic**: See [docs/ADMIN-LOGIC.md](docs/ADMIN-LOGIC.md) for how admin auth and inventory work.
- **Fat Zebra checkout**: The cart includes a "Checkout with Fat Zebra" button. Set `FATZEBRA_USERNAME` and `FATZEBRA_TOKEN` as secrets to enable the hosted payment form.

These are read in the Worker via `c.env.JWT_SECRET`, `c.env.FATZEBRA_USERNAME`, and `c.env.FATZEBRA_TOKEN`.

### Option 2: Without Database (Demo Mode)

1. Run `npm i`
2. Keep the Hyperdrive binding commented out in `wrangler.jsonc` (this is the default)
3. Deploy with `npm run deploy`
4. The app will automatically use mock data instead of a real database

## Resources

- [Neon PostgreSQL with Cloudflare Workers and Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/neon/)
- [Cloudflare Vite Plugin](https://www.npmjs.com/package/@cloudflare/vite-plugin)
- [Cloudflare Hyperdrive Documentation](https://developers.cloudflare.com/hyperdrive/get-started/)
- [Hono - Fast, Lightweight, Web Framework for Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)
