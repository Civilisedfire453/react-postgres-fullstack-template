# Connect the app to Neon (PostgreSQL)

Follow these steps so the water filter store uses your Neon database instead of mock data.

## 1. Get your Neon connection string

In the [Neon Console](https://console.neon.tech):

- Open your project and select the database.
- Copy the **connection string** (e.g. `postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

## 2. Create a Hyperdrive config

In the project root, run (paste your real connection string):

```bash
npx wrangler hyperdrive create my-waterfilters-db --connection-string="postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require"
```

Copy the **Hyperdrive ID** that is printed (e.g. `a1b2c3d4e5f6...`).

## 3. Update `wrangler.jsonc`

- Replace `YOUR_HYPERDRIVE_ID` with the ID from step 2.
- Replace the `localConnectionString` value with your **same Neon connection string** (so local dev uses Neon).

## 4. Seed the database

In the Neon Console → **SQL Editor**, run the entire contents of `init.sql` from this project. That creates tables and seeds water filter products and an admin user.

**Admin login after seeding:** `admin@example.com` / `admin123`

## 5. Set the JWT secret (required for auth)

```bash
npx wrangler secret put JWT_SECRET
```

When prompted, enter a long random string (e.g. from a password generator).

## 6. Run the app

```bash
npm run build
npx wrangler dev
```

Open the URL shown (e.g. `http://127.0.0.1:8787`). You should see water filter products from Neon and `"source": "database"` in the `/api/products` response.
