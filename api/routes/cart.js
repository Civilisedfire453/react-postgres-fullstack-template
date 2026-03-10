import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";
import { asPositiveInt, asTrimmedString, badRequest, isPlainObject } from "../lib/validate.js";

const cartRouter = new Hono();

// Helper to get or create a cart
async function getOrCreateCart(sql, userId, anonymousId) {
	const existing =
		userId != null
			? await sql`SELECT * FROM carts WHERE user_id = ${userId} AND status = 'active' LIMIT 1`
			: anonymousId
				? await sql`SELECT * FROM carts WHERE anonymous_id = ${anonymousId} AND status = 'active' LIMIT 1`
				: [];

	if (existing.length > 0) {
		return existing[0];
	}

	const [cart] = await sql`
    INSERT INTO carts (user_id, anonymous_id, status)
    VALUES (${userId ?? null}, ${anonymousId ?? null}, 'active')
    RETURNING *
  `;
	return cart;
}

// POST /api/cart - replace items in cart with provided items
cartRouter.post("/", async (c) => {
	const body = await c.req.json();
	const { userId, anonymousId, items } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!Array.isArray(items) || items.length === 0) return badRequest("Items array is required");
		if (items.length > 200) return badRequest("Too many items");

		const anon = asTrimmedString(anonymousId, { maxLen: 80 });

		const cart = await getOrCreateCart(sql, userId, anon);

		await sql`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;

		let inserted = 0;
		for (const item of items) {
			if (!isPlainObject(item)) continue;
			const productVariantId = asPositiveInt(item.productVariantId, { max: 2_000_000 });
			const quantity = asPositiveInt(item.quantity, { max: 1000 });
			if (!productVariantId || !quantity) continue;
			inserted += 1;
			await sql`
        INSERT INTO cart_items (cart_id, product_variant_id, quantity)
        VALUES (${cart.id}, ${productVariantId}, ${quantity})
        ON CONFLICT (cart_id, product_variant_id) DO UPDATE
        SET quantity = EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP
      `;
		}

		if (inserted === 0) return badRequest("No valid items provided");

		return Response.json({ cartId: cart.id });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Cart API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// GET /api/cart/:id
cartRouter.get("/:id", async (c) => {
	const id = c.req.param("id");

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		const carts = await sql`SELECT * FROM carts WHERE id = ${id}`;
		if (carts.length === 0) {
			return Response.json({ error: "Cart not found" }, { status: 404 });
		}

		const items = await sql`
      SELECT
        ci.id,
        ci.quantity,
        v.id AS variant_id,
        v.sku,
        v.name AS variant_name,
        v.price_cents,
        v.stock_quantity,
        p.id AS product_id,
        p.name AS product_name,
        p.brand,
        p.category
      FROM cart_items ci
      JOIN product_variants v ON v.id = ci.product_variant_id
      JOIN products p ON p.id = v.product_id
      WHERE ci.cart_id = ${id}
    `;

		let subtotalCents = 0;
		const lineItems = items.map((row) => {
			const lineTotal = row.price_cents * row.quantity;
			subtotalCents += lineTotal;
			return {
				id: row.id,
				productId: row.product_id,
				productName: row.product_name,
				brand: row.brand,
				category: row.category,
				variantId: row.variant_id,
				variantName: row.variant_name,
				sku: row.sku,
				priceCents: row.price_cents,
				quantity: row.quantity,
				lineTotalCents: lineTotal,
				availableStock: row.stock_quantity,
			};
		});

		return Response.json({
			cart: {
				id: carts[0].id,
				status: carts[0].status,
				items: lineItems,
				subtotalCents,
			},
		});
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Cart API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default cartRouter;

