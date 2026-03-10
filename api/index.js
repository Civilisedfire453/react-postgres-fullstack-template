import { Hono } from "hono";
import postgres from "postgres";
import productsRouter from "./routes/products.js";
import cartRouter from "./routes/cart.js";
import checkoutRouter from "./routes/checkout.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import { attachUserFromAuthHeader } from "./lib/auth.js";

const app = new Hono();

// Setup SQL client middleware (Hyperdrive or mock mode)
app.use("*", async (c, next) => {
	if (c.env.HYPERDRIVE) {
		try {
			const sql = postgres(c.env.HYPERDRIVE.connectionString, {
				max: 5,
				fetch_types: false,
			});

			c.env.SQL = sql;
			c.env.DB_AVAILABLE = true;

			await next();

			c.executionCtx.waitUntil(sql.end());
		} catch (error) {
			console.error("Database connection error:", error);
			c.env.DB_AVAILABLE = false;
			await next();
		}
	} else {
		console.log("No database connection available.");
		c.env.DB_AVAILABLE = false;
		await next();
	}
});

// Attach authenticated user (if any) from Authorization header
app.use("/api/*", attachUserFromAuthHeader());

// Public catalog
app.route("/api/products", productsRouter);

// Cart & checkout
app.route("/api/cart", cartRouter);
app.route("/api/checkout", checkoutRouter);

// Orders
app.route("/api/orders", ordersRouter);

// Auth
app.route("/api/auth", authRouter);

// Admin
app.route("/api/admin", adminRouter);

// Catch-all route for static assets
app.all("*", async (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default {
	fetch: app.fetch,
};
