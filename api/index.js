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

function withSecurityHeaders(res) {
	const headers = new Headers(res.headers);
	// Baseline hardening
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
	headers.set("Cross-Origin-Opener-Policy", "same-origin");
	headers.set("Cross-Origin-Resource-Policy", "same-origin");

	// CSP: allow our own app + Fat Zebra SDK when configured.
	// Note: HPP may require additional endpoints; expand connect-src/img-src if Fat Zebra requires it.
	const csp = [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-ancestors 'none'",
		// Vite/React inline styles can occur; Tailwind is class-based but keep safe fallback.
		"style-src 'self' 'unsafe-inline'",
		// Fat Zebra SDK is loaded from their CDN in CheckoutModal.
		"script-src 'self' https://cdn.pmnts-sandbox.io",
		"img-src 'self' data: https:",
		"font-src 'self' data:",
		"connect-src 'self' https:",
	];
	headers.set("Content-Security-Policy", csp.join("; "));

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers,
	});
}

// Apply security headers to all responses
app.use("*", async (c, next) => {
	await next();
	const res = c.res;
	c.res = withSecurityHeaders(res);
});

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
